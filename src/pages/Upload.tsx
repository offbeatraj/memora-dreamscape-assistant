
import Layout from "@/components/Layout";
import FileUploader from "@/components/FileUploader";
import { Upload } from "lucide-react";

export default function UploadPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-5 w-5 text-memora-purple" />
            <h1 className="text-2xl font-bold">Upload Information</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Upload medical records, personal memories, or any relevant information 
            to help personalize your experience with Memora.
          </p>
          
          <FileUploader />
          
          <div className="mt-8">
            <h2 className="text-lg font-medium mb-4">How uploaded data is used</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="bg-memora-purple text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">✓</span>
                <span>Your uploads are used to personalize responses and provide more relevant assistance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-memora-purple text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">✓</span>
                <span>All information is kept private and secure.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-memora-purple text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">✓</span>
                <span>You can delete uploaded information at any time from your account settings.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
