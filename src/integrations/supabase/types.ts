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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          created_at: string
          description: string
          earned_at: string
          icon: string
          id: string
          metadata: Json | null
          profile_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          description: string
          earned_at?: string
          icon: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          description?: string
          earned_at?: string
          icon?: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          chart_type: string | null
          color_theme: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chart_type?: string | null
          color_theme?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chart_type?: string | null
          color_theme?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          household_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          profile_id: string | null
          record_id: string | null
          table_name: string
          user_display_name: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          household_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          profile_id?: string | null
          record_id?: string | null
          table_name: string
          user_display_name?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          household_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          profile_id?: string | null
          record_id?: string | null
          table_name?: string
          user_display_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      category_names: {
        Row: {
          category_key: string
          created_at: string
          custom_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_key: string
          created_at?: string
          custom_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_key?: string
          created_at?: string
          custom_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          notes: string | null
          payment_date: string
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_risk_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          debt_to_income_ratio: number
          id: string
          message: string
          profile_id: string | null
          risk_level: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          debt_to_income_ratio: number
          id?: string
          message: string
          profile_id?: string | null
          risk_level: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          debt_to_income_ratio?: number
          id?: string
          message?: string
          profile_id?: string | null
          risk_level?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          apr: number
          balance: number
          bank: string | null
          created_at: string
          end_date: string | null
          id: string
          installment_amount: number | null
          is_installment: boolean | null
          minimum_payment: number
          name: string
          number_of_installments: number | null
          payment_day: number
          profile_id: string | null
          promotional_apr: number | null
          promotional_apr_end_date: string | null
          regular_apr: number | null
          start_date: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apr: number
          balance: number
          bank?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          installment_amount?: number | null
          is_installment?: boolean | null
          minimum_payment: number
          name: string
          number_of_installments?: number | null
          payment_day: number
          profile_id?: string | null
          promotional_apr?: number | null
          promotional_apr_end_date?: string | null
          regular_apr?: number | null
          start_date?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apr?: number
          balance?: number
          bank?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          installment_amount?: number | null
          is_installment?: boolean | null
          minimum_payment?: number
          name?: string
          number_of_installments?: number | null
          payment_day?: number
          profile_id?: string | null
          promotional_apr?: number | null
          promotional_apr_end_date?: string | null
          regular_apr?: number | null
          start_date?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_profiles: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          amount: number
          created_at: string
          frequency: string
          frequency_type: string
          id: string
          name: string
          payment_day: number
          payment_month: number | null
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          frequency?: string
          frequency_type?: string
          id?: string
          name: string
          payment_day: number
          payment_month?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          frequency?: string
          frequency_type?: string
          id?: string
          name?: string
          payment_day?: number
          payment_month?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_backups: {
        Row: {
          backup_data: Json
          created_at: string
          created_by: string
          description: string | null
          household_id: string
          id: string
        }
        Insert: {
          backup_data: Json
          created_at?: string
          created_by: string
          description?: string | null
          household_id: string
          id?: string
        }
        Update: {
          backup_data?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          household_id?: string
          id?: string
        }
        Relationships: []
      }
      household_invitations: {
        Row: {
          created_at: string
          expires_at: string
          household_id: string
          id: string
          invitation_code: string
          invited_by: string
          invited_email: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          household_id: string
          id?: string
          invitation_code: string
          invited_by: string
          invited_email: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          household_id?: string
          id?: string
          invitation_code?: string
          invited_by?: string
          invited_email?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          created_at: string
          display_name: string | null
          household_id: string
          id: string
          invited_by: string | null
          joined_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          household_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          household_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      household_user_roles: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: Database["public"]["Enums"]["household_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role?: Database["public"]["Enums"]["household_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: Database["public"]["Enums"]["household_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      income_sources: {
        Row: {
          amount: number
          created_at: string
          day_of_week: number | null
          frequency: string | null
          id: string
          income_type: string | null
          name: string
          payment_day: number
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          day_of_week?: number | null
          frequency?: string | null
          id?: string
          income_type?: string | null
          name: string
          payment_day: number
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          day_of_week?: number | null
          frequency?: string | null
          id?: string
          income_type?: string | null
          name?: string
          payment_day?: number
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_read: boolean
          message: string
          profile_id: string | null
          related_id: string | null
          related_table: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_read?: boolean
          message: string
          profile_id?: string | null
          related_id?: string | null
          related_table?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_read?: boolean
          message?: string
          profile_id?: string | null
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_tracker: {
        Row: {
          amount: number
          created_at: string
          id: string
          month_year: string
          notes: string | null
          payment_date: string | null
          payment_status: string
          payment_type: string
          profile_id: string | null
          source_id: string | null
          source_table: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month_year: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: string
          payment_type: string
          profile_id?: string | null
          source_id?: string | null
          source_table?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month_year?: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: string
          payment_type?: string
          profile_id?: string | null
          source_id?: string | null
          source_table?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings: {
        Row: {
          created_at: string
          emergency_fund: number | null
          goal_description: string | null
          goal_name: string | null
          id: string
          monthly_emergency_contribution: number | null
          monthly_goal: number
          profile_id: string | null
          total_accumulated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_fund?: number | null
          goal_description?: string | null
          goal_name?: string | null
          id?: string
          monthly_emergency_contribution?: number | null
          monthly_goal?: number
          profile_id?: string | null
          total_accumulated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_fund?: number | null
          goal_description?: string | null
          goal_name?: string | null
          id?: string
          monthly_emergency_contribution?: number | null
          monthly_goal?: number
          profile_id?: string | null
          total_accumulated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          goal_description: string | null
          goal_name: string
          id: string
          is_active: boolean | null
          monthly_contribution: number | null
          profile_id: string | null
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          goal_description?: string | null
          goal_name: string
          id?: string
          is_active?: boolean | null
          monthly_contribution?: number | null
          profile_id?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          goal_description?: string | null
          goal_name?: string
          id?: string
          is_active?: boolean | null
          monthly_contribution?: number | null
          profile_id?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          month_year: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          month_year: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month_year?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      variable_expense_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      variable_expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          id: string
          name: string | null
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          id?: string
          name?: string | null
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          id?: string
          name?: string | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variable_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "variable_expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variable_expenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      variable_income: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          id: string
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variable_income_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_household_role: {
        Args: {
          _household_id: string
          _role: Database["public"]["Enums"]["household_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_household_member: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      is_household_owner: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      household_role: "owner" | "member" | "viewer" | "contributor" | "editor"
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
    Enums: {
      household_role: ["owner", "member", "viewer", "contributor", "editor"],
    },
  },
} as const
