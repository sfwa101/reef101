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
      addresses: {
        Row: {
          building: string | null
          city: string
          created_at: string
          district: string | null
          id: string
          is_default: boolean
          label: string
          notes: string | null
          street: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          building?: string | null
          city: string
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label: string
          notes?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          building?: string | null
          city?: string
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string
          notes?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tasks: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_photo_url: string | null
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          estimated_minutes: number | null
          id: string
          order_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_photo_url?: string | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_minutes?: number | null
          id?: string
          order_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_photo_url?: string | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_minutes?: number | null
          id?: string
          order_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_verifications: {
        Row: {
          back_image_path: string | null
          created_at: string
          front_image_path: string | null
          id: string
          national_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back_image_path?: string | null
          created_at?: string
          front_image_path?: string | null
          id?: string
          national_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back_image_path?: string | null
          created_at?: string
          front_image_path?: string | null
          id?: string
          national_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          icon: string | null
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          store_id: string | null
          sub_order_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price?: number
          product_id: string
          product_image?: string | null
          product_name: string
          quantity?: number
          store_id?: string | null
          sub_order_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          store_id?: string | null
          sub_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          status: string
          total: number
          updated_at: string
          user_id: string
          whatsapp_sent: boolean
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id: string
          whatsapp_sent?: boolean
        }
        Update: {
          address_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
          whatsapp_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          binding: string
          color_mode: string
          copies: number
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          notes: string | null
          pages: number
          ready_at: string | null
          sided: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          binding?: string
          color_mode?: string
          copies?: number
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          pages?: number
          ready_at?: string | null
          sided?: string
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          binding?: string
          color_mode?: string
          copies?: number
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          pages?: number
          ready_at?: string | null
          sided?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          addons: Json | null
          badge: string | null
          brand: string | null
          category: string
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          image_url: string | null
          is_active: boolean
          name: string
          old_price: number | null
          price: number
          rating: number | null
          sort_order: number
          source: string
          stock: number
          store_id: string | null
          sub_category: string | null
          unit: string
          updated_at: string
          variants: Json | null
        }
        Insert: {
          addons?: Json | null
          badge?: string | null
          brand?: string | null
          category?: string
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean
          name: string
          old_price?: number | null
          price?: number
          rating?: number | null
          sort_order?: number
          source?: string
          stock?: number
          store_id?: string | null
          sub_category?: string | null
          unit?: string
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          addons?: Json | null
          badge?: string | null
          brand?: string | null
          category?: string
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean
          name?: string
          old_price?: number | null
          price?: number
          rating?: number | null
          sort_order?: number
          source?: string
          stock?: number
          store_id?: string | null
          sub_category?: string | null
          unit?: string
          updated_at?: string
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          birth_date: string | null
          budget_range: string | null
          created_at: string
          dislikes: string[] | null
          full_name: string | null
          gender: string | null
          household_size: number | null
          id: string
          lifestyle_tags: string[] | null
          likes: string[] | null
          occupation: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          budget_range?: string | null
          created_at?: string
          dislikes?: string[] | null
          full_name?: string | null
          gender?: string | null
          household_size?: number | null
          id: string
          lifestyle_tags?: string[] | null
          likes?: string[] | null
          occupation?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          budget_range?: string | null
          created_at?: string
          dislikes?: string[] | null
          full_name?: string | null
          gender?: string | null
          household_size?: number | null
          id?: string
          lifestyle_tags?: string[] | null
          likes?: string[] | null
          occupation?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission: number
          created_at: string
          first_order_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          commission?: number
          created_at?: string
          first_order_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          commission?: number
          created_at?: string
          first_order_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      savings_jar: {
        Row: {
          auto_save_enabled: boolean
          balance: number
          created_at: string
          goal: number | null
          goal_label: string | null
          id: string
          round_to: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save_enabled?: boolean
          balance?: number
          created_at?: string
          goal?: number | null
          goal_label?: string | null
          id?: string
          round_to?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save_enabled?: boolean
          balance?: number
          created_at?: string
          goal?: number | null
          goal_label?: string | null
          id?: string
          round_to?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          label: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind?: string
          label: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      store_settlements: {
        Row: {
          commission_amount: number
          commission_pct: number
          created_at: string
          gross_sales: number
          id: string
          net_payout: number
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          store_id: string
        }
        Insert: {
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          gross_sales?: number
          id?: string
          net_payout?: number
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          store_id: string
        }
        Update: {
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          gross_sales?: number
          id?: string
          net_payout?: number
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_settlements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          commission_pct: number
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          commission_pct?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          slug: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          commission_pct?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_orders: {
        Row: {
          assigned_collector_id: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          ready_at: string | null
          status: string
          store_id: string
          total: number
          updated_at: string
        }
        Insert: {
          assigned_collector_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          ready_at?: string | null
          status?: string
          store_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          assigned_collector_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          ready_at?: string | null
          status?: string
          store_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          balance: number
          cashback: number
          coupons: number
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          cashback?: number
          coupons?: number
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          cashback?: number
          coupons?: number
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          label: string
          source: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          label: string
          source?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          label?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_referral_code: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      user_store_ids: { Args: { _user_id: string }; Returns: string[] }
      user_total_spent: { Args: { _user_id: string }; Returns: number }
      user_trust_limit: { Args: { _user_id: string }; Returns: number }
      wallet_transfer: {
        Args: { _amount: number; _note?: string; _recipient_phone: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "cashier"
        | "store_manager"
        | "collector"
        | "delivery"
        | "finance"
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
      app_role: [
        "admin",
        "staff",
        "cashier",
        "store_manager",
        "collector",
        "delivery",
        "finance",
      ],
    },
  },
} as const
