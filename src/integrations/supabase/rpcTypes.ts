
/**
 * Type definitions for custom Supabase RPC functions
 */

export interface RecentFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  file_category: string;
  upload_date: string;
  patient_name: string;
}

export type SupabaseRPC = {
  get_recent_files: (args: { limit_count: number }) => Promise<RecentFile[]>;
};
