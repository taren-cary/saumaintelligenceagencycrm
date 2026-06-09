export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      client_systems: {
        Row: {
          architecture_notes: string | null
          client_id: string | null
          created_at: string | null
          credentials_vault_note: string | null
          description: string | null
          id: string
          integrations: Json | null
          known_issues: string | null
          last_deployed_at: string | null
          monitoring_url: string | null
          name: string
          on_call_instructions: string | null
          production_url: string | null
          repo_url: string | null
          staging_url: string | null
          status: string | null
          tech_stack: string[] | null
          updated_at: string | null
        }
        Insert: {
          architecture_notes?: string | null
          client_id?: string | null
          created_at?: string | null
          credentials_vault_note?: string | null
          description?: string | null
          id?: string
          integrations?: Json | null
          known_issues?: string | null
          last_deployed_at?: string | null
          monitoring_url?: string | null
          name: string
          on_call_instructions?: string | null
          production_url?: string | null
          repo_url?: string | null
          staging_url?: string | null
          status?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
        }
        Update: {
          architecture_notes?: string | null
          client_id?: string | null
          created_at?: string | null
          credentials_vault_note?: string | null
          description?: string | null
          id?: string
          integrations?: Json | null
          known_issues?: string | null
          last_deployed_at?: string | null
          monitoring_url?: string | null
          name?: string
          on_call_instructions?: string | null
          production_url?: string | null
          repo_url?: string | null
          staging_url?: string | null
          status?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_systems_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_model: string | null
          blocked_on_client: string | null
          blocked_on_us: string | null
          comm_preference: string | null
          company: string | null
          contract_end: string | null
          contract_renewal: string | null
          contract_start: string | null
          created_at: string | null
          email: string | null
          health_score: number | null
          hourly_rate: number | null
          id: string
          monthly_value: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          status: string
          tags: string[] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          billing_model?: string | null
          blocked_on_client?: string | null
          blocked_on_us?: string | null
          comm_preference?: string | null
          company?: string | null
          contract_end?: string | null
          contract_renewal?: string | null
          contract_start?: string | null
          created_at?: string | null
          email?: string | null
          health_score?: number | null
          hourly_rate?: number | null
          id?: string
          monthly_value?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_model?: string | null
          blocked_on_client?: string | null
          blocked_on_us?: string | null
          comm_preference?: string | null
          company?: string | null
          contract_end?: string | null
          contract_renewal?: string | null
          contract_start?: string | null
          created_at?: string | null
          email?: string | null
          health_score?: number | null
          hourly_rate?: number | null
          id?: string
          monthly_value?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          client_id: string | null
          created_at: string | null
          decisions_made: string[] | null
          direction: string | null
          follow_up_date: string | null
          follow_up_note: string | null
          follow_up_required: boolean | null
          id: string
          logged_at: string | null
          subject: string | null
          summary: string
          type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          decisions_made?: string[] | null
          direction?: string | null
          follow_up_date?: string | null
          follow_up_note?: string | null
          follow_up_required?: boolean | null
          id?: string
          logged_at?: string | null
          subject?: string | null
          summary: string
          type: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          decisions_made?: string[] | null
          direction?: string | null
          follow_up_date?: string | null
          follow_up_note?: string | null
          follow_up_required?: boolean | null
          id?: string
          logged_at?: string | null
          subject?: string | null
          summary?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions_log: {
        Row: {
          client_id: string | null
          created_at: string | null
          decision: string
          id: string
          logged_at: string | null
          made_by: string | null
          rationale: string | null
          system_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          decision: string
          id?: string
          logged_at?: string | null
          made_by?: string | null
          rationale?: string | null
          system_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          decision?: string
          id?: string
          logged_at?: string | null
          made_by?: string | null
          rationale?: string | null
          system_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_log_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "client_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          estimated_value: number | null
          expected_close: string | null
          id: string
          lost_reason: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          phone: string | null
          platform_notes: string | null
          probability: number | null
          source: string | null
          stage: string | null
          system_type: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          name: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          platform_notes?: string | null
          probability?: number | null
          source?: string | null
          stage?: string | null
          system_type?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          platform_notes?: string | null
          probability?: number | null
          source?: string | null
          stage?: string | null
          system_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_hours: number | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          estimated_hours: number | null
          estimated_value: number | null
          id: string
          name: string
          notes: string | null
          phase: string | null
          scope_locked: boolean | null
          start_date: string | null
          status: string | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          estimated_value?: number | null
          id?: string
          name: string
          notes?: string | null
          phase?: string | null
          scope_locked?: boolean | null
          start_date?: string | null
          status?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          estimated_value?: number | null
          id?: string
          name?: string
          notes?: string | null
          phase?: string | null
          scope_locked?: boolean | null
          start_date?: string | null
          status?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "client_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_scope_creep: boolean | null
          priority: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_scope_creep?: boolean | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_scope_creep?: boolean | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          billable: boolean | null
          client_id: string | null
          created_at: string | null
          description: string
          hours: number
          id: string
          logged_date: string | null
          project_id: string | null
          task_id: string | null
        }
        Insert: {
          billable?: boolean | null
          client_id?: string | null
          created_at?: string | null
          description: string
          hours: number
          id?: string
          logged_date?: string | null
          project_id?: string | null
          task_id?: string | null
        }
        Update: {
          billable?: boolean | null
          client_id?: string | null
          created_at?: string | null
          description?: string
          hours?: number
          id?: string
          logged_date?: string | null
          project_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
