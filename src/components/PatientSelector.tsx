
import { useState, useEffect } from "react";
import { Check, Search, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  stage: string;
  gender: string;
}

interface PatientSelectorProps {
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientSelector({ onSelectPatient }: PatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPatients() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('patients')
          .select('id, name, age, diagnosis, stage, gender');
        
        if (error) {
          console.error('Error fetching patients:', error);
          toast({
            title: "Error fetching patients",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data) {
          setPatients(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPatients();
  }, [toast]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "early":
        return "bg-green-100 text-green-800 border-green-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpen(false);
    onSelectPatient(patient);
  };

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-dashed"
            disabled={isLoading}
          >
            {selectedPatient ? (
              <>
                <Avatar className="h-6 w-6">
                  <User className="h-4 w-4" />
                </Avatar>
                <span>{selectedPatient.name}</span>
                <Badge variant="outline" className={getStageColor(selectedPatient.stage)}>
                  {selectedPatient.stage}
                </Badge>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Select Patient
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5} avoidCollisions={true} width="300px">
          <Command>
            <CommandInput placeholder="Search patients..." />
            <CommandList>
              <CommandEmpty>No patients found.</CommandEmpty>
              <CommandGroup>
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    onSelect={() => handleSelectPatient(patient)}
                    className="flex items-center gap-2 py-3"
                  >
                    <Avatar className="h-8 w-8">
                      <User className="h-4 w-4" />
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{patient.name}</p>
                        <Badge variant="outline" className={getStageColor(patient.stage)}>
                          {patient.stage}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {patient.age} • {patient.gender} • {patient.diagnosis}
                      </p>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
