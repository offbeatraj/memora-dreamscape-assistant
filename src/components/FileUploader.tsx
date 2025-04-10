
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Loader2, Check, FileImage, File } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

export default function FileUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [fileType, setFileType] = useState<"medical" | "personal" | "other">("medical");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // Set patient ID from route params if available
    if (id) {
      setPatientId(id);
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if we have a patient ID
    if (!patientId) {
      toast({
        title: "Patient not found",
        description: "Please ensure you're viewing a patient's profile before uploading files.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Process each file
      for (const file of files) {
        // 1. Upload file to Supabase Storage
        const fileName = `${patientId}/${Date.now()}-${file.name}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from('patient-files')
          .upload(fileName, file);
        
        if (fileError) {
          throw fileError;
        }

        // Get the public URL for the file
        const { data: urlData } = supabase.storage
          .from('patient-files')
          .getPublicUrl(fileName);

        // 2. Create record in patient_files table using RPC function
        const { error: dbError } = await (supabase.rpc('insert_patient_file', {
          p_patient_id: patientId,
          p_file_name: file.name,
          p_file_type: file.type,
          p_file_size: file.size,
          p_file_path: urlData?.publicUrl ?? fileName,
          p_file_category: fileType,
          p_notes: notes.trim() ? notes : null
        } as any)); // Using type assertion to bypass TypeScript errors
        
        if (dbError) {
          throw dbError;
        }
      }
      
      setUploadSuccess(true);
      
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) have been processed and added to the patient's record.`,
      });
      
      // Reset form after successful upload
      setTimeout(() => {
        setFiles([]);
        setNotes("");
        setFileType("medical");
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return <File className="h-5 w-5 text-memora-purple" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <FileImage className="h-5 w-5 text-memora-purple" />;
    } else {
      return <FileText className="h-5 w-5 text-memora-purple" />;
    }
  };

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <Label htmlFor="file-type" className="block mb-2">
              File Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={fileType === "medical" ? "default" : "outline"}
                className={fileType === "medical" ? "bg-memora-purple hover:bg-memora-purple-dark" : ""}
                onClick={() => setFileType("medical")}
              >
                Medical Records
              </Button>
              <Button
                type="button"
                variant={fileType === "personal" ? "default" : "outline"}
                className={fileType === "personal" ? "bg-memora-purple hover:bg-memora-purple-dark" : ""}
                onClick={() => setFileType("personal")}
              >
                Personal Memories
              </Button>
              <Button
                type="button"
                variant={fileType === "other" ? "default" : "outline"}
                className={fileType === "other" ? "bg-memora-purple hover:bg-memora-purple-dark" : ""}
                onClick={() => setFileType("other")}
              >
                Other Documents
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="file-upload" className="block mb-2">
              Upload Files
            </Label>
            <div
              className="border-2 border-dashed border-memora-purple/30 rounded-lg p-8 text-center cursor-pointer hover:bg-memora-purple/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-memora-purple" />
              <p className="mb-1 font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">
                PDF, DOCX, JPG, PNG (Max 10MB each)
              </p>
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="mb-6">
              <Label className="block mb-2">Selected Files</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-white/70 p-2 rounded-md hover:bg-white/90 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getFileIcon(file)}
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <Label htmlFor="notes" className="block mb-2">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={fileType === "medical" ? "Add any relevant medical information..." : fileType === "personal" ? "Add context about these personal memories..." : "Add any helpful notes about these documents..."}
              className="bg-white/70"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-memora-purple hover:bg-memora-purple-dark transition-all duration-300"
            disabled={uploading || uploadSuccess}
          >
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadSuccess && <Check className="mr-2 h-4 w-4" />}
            {uploading
              ? "Processing Files..."
              : uploadSuccess
              ? "Files Successfully Processed"
              : `Upload ${fileType === "medical" ? "Medical Records" : fileType === "personal" ? "Personal Memories" : "Documents"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
