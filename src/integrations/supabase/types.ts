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
      affiliate_settings: {
        Row: {
          category: string
          created_at: string
          default_commission_pct: number
          id: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          default_commission_pct?: number
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          default_commission_pct?: number
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          category_slug: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          placement: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          code: string
          country: string
          country_code: string
          created_at: string
          currency: string
          default_locale: string
          id: string
          is_active: boolean
          name: string
          supported_locales: string[]
          timezone: string
          updated_at: string
        }
        Insert: {
          code: string
          country: string
          country_code: string
          created_at?: string
          currency?: string
          default_locale?: string
          id?: string
          is_active?: boolean
          name: string
          supported_locales?: string[]
          timezone?: string
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string
          country_code?: string
          created_at?: string
          currency?: string
          default_locale?: string
          id?: string
          is_active?: boolean
          name?: string
          supported_locales?: string[]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      cashier_sessions: {
        Row: {
          branch_id: string | null
          cashier_id: string
          closed_at: string | null
          closing_cash: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_float: number
          total_orders: number
          total_sales: number
        }
        Insert: {
          branch_id?: string | null
          cashier_id: string
          closed_at?: string | null
          closing_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float?: number
          total_orders?: number
          total_sales?: number
        }
        Update: {
          branch_id?: string | null
          cashier_id?: string
          closed_at?: string | null
          closing_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float?: number
          total_orders?: number
          total_sales?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashier_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_i18n: Json | null
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_i18n?: Json | null
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_i18n?: Json | null
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
      category_budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      charity_ledger: {
        Row: {
          base_amount: number
          created_at: string
          due_amount: number
          id: string
          notes: string | null
          paid_at: string | null
          paid_to: string | null
          period_end: string
          period_start: string
          rule_id: string | null
          rule_name: string
          status: string
        }
        Insert: {
          base_amount?: number
          created_at?: string
          due_amount?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_to?: string | null
          period_end: string
          period_start: string
          rule_id?: string | null
          rule_name: string
          status?: string
        }
        Update: {
          base_amount?: number
          created_at?: string
          due_amount?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_to?: string | null
          period_end?: string
          period_start?: string
          rule_id?: string | null
          rule_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "charity_ledger_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "charity_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      charity_rules: {
        Row: {
          base: string
          created_at: string
          fixed_amount: number | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          percentage: number | null
          updated_at: string
        }
        Insert: {
          base: string
          created_at?: string
          fixed_amount?: number | null
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          percentage?: number | null
          updated_at?: string
        }
        Update: {
          base?: string
          created_at?: string
          fixed_amount?: number | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          percentage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      commission_ledger: {
        Row: {
          affiliate_user_id: string
          base_amount: number
          category: string | null
          clawed_back_at: string | null
          commission_amount: number
          commission_pct: number
          created_at: string
          customer_user_id: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          product_id: string | null
          product_name: string | null
          status: string
          vest_release_at: string | null
        }
        Insert: {
          affiliate_user_id: string
          base_amount?: number
          category?: string | null
          clawed_back_at?: string | null
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          customer_user_id?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          product_name?: string | null
          status?: string
          vest_release_at?: string | null
        }
        Update: {
          affiliate_user_id?: string
          base_amount?: number
          category?: string | null
          clawed_back_at?: string | null
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          customer_user_id?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          product_name?: string | null
          status?: string
          vest_release_at?: string | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          order_id: string | null
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          order_id?: string | null
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          order_id?: string | null
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_pct: number
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_total: number | null
          min_user_level: Database["public"]["Enums"]["app_user_level"]
          per_user_limit: number
          starts_at: string | null
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_total?: number | null
          min_user_level?: Database["public"]["Enums"]["app_user_level"]
          per_user_limit?: number
          starts_at?: string | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_total?: number | null
          min_user_level?: Database["public"]["Enums"]["app_user_level"]
          per_user_limit?: number
          starts_at?: string | null
          uses_count?: number
        }
        Relationships: []
      }
      cross_branch_transfers: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          product_id: string
          quantity_pieces: number
          shipping_cost: number | null
          source_branch_id: string | null
          source_warehouse_id: string | null
          status: string
          target_branch_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id: string
          quantity_pieces: number
          shipping_cost?: number | null
          source_branch_id?: string | null
          source_warehouse_id?: string | null
          status?: string
          target_branch_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id?: string
          quantity_pieces?: number
          shipping_cost?: number | null
          source_branch_id?: string | null
          source_warehouse_id?: string | null
          status?: string
          target_branch_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_branch_transfers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_branch_transfers_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_branch_transfers_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_branch_transfers_target_branch_id_fkey"
            columns: ["target_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_expenses: {
        Row: {
          amount: number
          branch_id: string | null
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          notes: string | null
          paid_to: string | null
          payment_method: string | null
          receipt_url: string | null
          reference: string | null
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          branch_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_events: {
        Row: {
          created_at: string
          driver_id: string | null
          event_type: string
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          proof_data: string | null
          proof_type: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          event_type: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          proof_data?: string | null
          proof_type?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          event_type?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          proof_data?: string | null
          proof_type?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "delivery_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settings: {
        Row: {
          disable_barcode_for_express: boolean
          disable_barcode_zones: string[]
          gps_proof_required_when_disabled: boolean
          id: string
          require_barcode_default: boolean
          updated_at: string
        }
        Insert: {
          disable_barcode_for_express?: boolean
          disable_barcode_zones?: string[]
          gps_proof_required_when_disabled?: boolean
          id?: string
          require_barcode_default?: boolean
          updated_at?: string
        }
        Update: {
          disable_barcode_for_express?: boolean
          disable_barcode_zones?: string[]
          gps_proof_required_when_disabled?: boolean
          id?: string
          require_barcode_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      delivery_tasks: {
        Row: {
          cod_amount: number
          cod_collected: boolean
          commission_amount: number
          commission_paid: boolean
          created_at: string
          customer_barcode: string | null
          delivered_at: string | null
          delivery_photo_url: string | null
          delivery_zone: string | null
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          estimated_minutes: number | null
          id: string
          order_id: string
          proof_lat: number | null
          proof_lng: number | null
          proof_type: string | null
          service_type: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cod_amount?: number
          cod_collected?: boolean
          commission_amount?: number
          commission_paid?: boolean
          created_at?: string
          customer_barcode?: string | null
          delivered_at?: string | null
          delivery_photo_url?: string | null
          delivery_zone?: string | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_minutes?: number | null
          id?: string
          order_id: string
          proof_lat?: number | null
          proof_lng?: number | null
          proof_type?: string | null
          service_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cod_amount?: number
          cod_collected?: boolean
          commission_amount?: number
          commission_paid?: boolean
          created_at?: string
          customer_barcode?: string | null
          delivered_at?: string | null
          delivery_photo_url?: string | null
          delivery_zone?: string | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_minutes?: number | null
          id?: string
          order_id?: string
          proof_lat?: number | null
          proof_lng?: number | null
          proof_type?: string | null
          service_type?: string
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
      discount_overrides: {
        Row: {
          attempted_discount: number
          cost_price: number | null
          created_at: string
          id: string
          margin_amount: number
          override_by: string
          override_by_name: string | null
          product_id: string
          product_name: string
          reason: string
          sale_price: number
        }
        Insert: {
          attempted_discount: number
          cost_price?: number | null
          created_at?: string
          id?: string
          margin_amount: number
          override_by: string
          override_by_name?: string | null
          product_id: string
          product_name: string
          reason: string
          sale_price: number
        }
        Update: {
          attempted_discount?: number
          cost_price?: number | null
          created_at?: string
          id?: string
          margin_amount?: number
          override_by?: string
          override_by_name?: string | null
          product_id?: string
          product_name?: string
          reason?: string
          sale_price?: number
        }
        Relationships: []
      }
      discounts: {
        Row: {
          created_at: string
          discount_amount: number | null
          discount_pct: number
          ends_at: string | null
          id: string
          is_active: boolean
          min_order_total: number | null
          min_user_level: Database["public"]["Enums"]["app_user_level"]
          name: string
          scope: string
          scope_value: string | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          discount_pct?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_total?: number | null
          min_user_level?: Database["public"]["Enums"]["app_user_level"]
          name: string
          scope: string
          scope_value?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          discount_pct?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_total?: number | null
          min_user_level?: Database["public"]["Enums"]["app_user_level"]
          name?: string
          scope?: string
          scope_value?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_cash_settlements: {
        Row: {
          amount: number
          bank_reference: string | null
          created_at: string
          driver_id: string
          id: string
          kind: string
          notes: string | null
          received_by: string
          received_by_name: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          created_at?: string
          driver_id: string
          id?: string
          kind?: string
          notes?: string | null
          received_by: string
          received_by_name?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          kind?: string
          notes?: string | null
          received_by?: string
          received_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_cash_settlements_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_commission_rules: {
        Row: {
          commission_flat: number
          commission_pct: number
          driver_type: string
          id: string
          max_per_order: number | null
          min_per_order: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          commission_flat?: number
          commission_pct?: number
          driver_type: string
          id?: string
          max_per_order?: number | null
          min_per_order?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          commission_flat?: number
          commission_pct?: number
          driver_type?: string
          id?: string
          max_per_order?: number | null
          min_per_order?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_wallets: {
        Row: {
          cash_in_hand: number
          driver_id: string
          earned_balance: number
          lifetime_earned: number
          lifetime_settled: number
          updated_at: string
        }
        Insert: {
          cash_in_hand?: number
          driver_id: string
          earned_balance?: number
          lifetime_earned?: number
          lifetime_settled?: number
          updated_at?: string
        }
        Update: {
          cash_in_hand?: number
          driver_id?: string
          earned_balance?: number
          lifetime_earned?: number
          lifetime_settled?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_wallets_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          base_salary: number
          branch_id: string | null
          commission_flat: number | null
          commission_pct: number | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          current_zone: string | null
          driver_type: string
          full_name: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          national_id: string | null
          phone: string
          third_party_company: string | null
          updated_at: string
          user_id: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          base_salary?: number
          branch_id?: string | null
          commission_flat?: number | null
          commission_pct?: number | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_zone?: string | null
          driver_type?: string
          full_name: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          national_id?: string | null
          phone: string
          third_party_company?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          base_salary?: number
          branch_id?: string | null
          commission_flat?: number | null
          commission_pct?: number | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_zone?: string | null
          driver_type?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          national_id?: string | null
          phone?: string
          third_party_company?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
      flash_deals: {
        Row: {
          category: string | null
          created_at: string
          discount_pct: number
          end_time: string
          id: string
          is_active: boolean
          original_price: number
          product_id: string
          product_name: string | null
          reason: string | null
          start_time: string
          target_segment: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          discount_pct: number
          end_time: string
          id?: string
          is_active?: boolean
          original_price: number
          product_id: string
          product_name?: string | null
          reason?: string | null
          start_time?: string
          target_segment?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          discount_pct?: number
          end_time?: string
          id?: string
          is_active?: boolean
          original_price?: number
          product_id?: string
          product_name?: string | null
          reason?: string | null
          start_time?: string
          target_segment?: string | null
        }
        Relationships: []
      }
      flash_sale_products: {
        Row: {
          category: string | null
          created_at: string
          discount_pct: number
          flash_sale_id: string
          id: string
          original_price: number
          product_id: string
          product_name: string | null
          rank: number
          reason: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          discount_pct: number
          flash_sale_id: string
          id?: string
          original_price: number
          product_id: string
          product_name?: string | null
          rank?: number
          reason?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          discount_pct?: number
          flash_sale_id?: string
          id?: string
          original_price?: number
          product_id?: string
          product_name?: string | null
          rank?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_products_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string
          cycle_label: string | null
          ends_at: string
          id: string
          is_active: boolean
          starts_at: string
        }
        Insert: {
          created_at?: string
          cycle_label?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          starts_at?: string
        }
        Update: {
          created_at?: string
          cycle_label?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          starts_at?: string
        }
        Relationships: []
      }
      hakim_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hakim_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "hakim_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      hakim_chat_sessions: {
        Row: {
          context_period_days: number | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_period_days?: number | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_period_days?: number | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hakim_insights: {
        Row: {
          created_at: string
          generated_for_date: string
          id: string
          is_read: boolean
          kind: string
          raw_snapshot: Json | null
          recommendations: Json | null
          severity: string
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          generated_for_date?: string
          id?: string
          is_read?: boolean
          kind: string
          raw_snapshot?: Json | null
          recommendations?: Json | null
          severity?: string
          summary: string
          title: string
        }
        Update: {
          created_at?: string
          generated_for_date?: string
          id?: string
          is_read?: boolean
          kind?: string
          raw_snapshot?: Json | null
          recommendations?: Json | null
          severity?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      inventory_locations: {
        Row: {
          created_at: string
          id: string
          last_restocked_at: string | null
          product_id: string
          reorder_point: number | null
          reserved: number
          stock: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_restocked_at?: string | null
          product_id: string
          reorder_point?: number | null
          reserved?: number
          stock?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_restocked_at?: string | null
          product_id?: string
          reorder_point?: number | null
          reserved?: number
          stock?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
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
      mega_events: {
        Row: {
          active_date: string | null
          banner_color_hex: string
          banner_subtitle: string | null
          banner_title: string
          category_discounts: Json
          created_at: string
          global_discount_pct: number
          id: string
          is_active: boolean
          name: string
          trigger_kind: string
          updated_at: string
        }
        Insert: {
          active_date?: string | null
          banner_color_hex?: string
          banner_subtitle?: string | null
          banner_title: string
          category_discounts?: Json
          created_at?: string
          global_discount_pct?: number
          id?: string
          is_active?: boolean
          name: string
          trigger_kind: string
          updated_at?: string
        }
        Update: {
          active_date?: string | null
          banner_color_hex?: string
          banner_subtitle?: string | null
          banner_title?: string
          category_discounts?: Json
          created_at?: string
          global_discount_pct?: number
          id?: string
          is_active?: boolean
          name?: string
          trigger_kind?: string
          updated_at?: string
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
          delivery_zone: string | null
          id: string
          notes: string | null
          payment_method: string | null
          service_type: string
          status: string
          total: number
          updated_at: string
          user_id: string
          whatsapp_sent: boolean
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          delivery_zone?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          service_type?: string
          status?: string
          total?: number
          updated_at?: string
          user_id: string
          whatsapp_sent?: boolean
        }
        Update: {
          address_id?: string | null
          created_at?: string
          delivery_zone?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          service_type?: string
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
      partner_ledgers: {
        Row: {
          amount_due: number
          cost: number
          created_at: string
          gross_profit: number
          id: string
          net_profit: number
          order_id: string | null
          order_item_id: string | null
          paid_at: string | null
          partner_id: string
          partner_name: string
          partner_user_id: string | null
          percentage: number
          product_id: string | null
          product_name: string | null
          quantity: number
          revenue: number
          split_type: string
          status: string
        }
        Insert: {
          amount_due?: number
          cost?: number
          created_at?: string
          gross_profit?: number
          id?: string
          net_profit?: number
          order_id?: string | null
          order_item_id?: string | null
          paid_at?: string | null
          partner_id: string
          partner_name: string
          partner_user_id?: string | null
          percentage: number
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          revenue?: number
          split_type: string
          status?: string
        }
        Update: {
          amount_due?: number
          cost?: number
          created_at?: string
          gross_profit?: number
          id?: string
          net_profit?: number
          order_id?: string | null
          order_item_id?: string | null
          paid_at?: string | null
          partner_id?: string
          partner_name?: string
          partner_user_id?: string | null
          percentage?: number
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          revenue?: number
          split_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_ledgers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_ledgers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_ledgers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "product_partners"
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
      product_batches: {
        Row: {
          batch_code: string | null
          cost_per_unit: number | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          received_at: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          batch_code?: string | null
          cost_per_unit?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          received_at?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          batch_code?: string | null
          cost_per_unit?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          received_at?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          partner_name: string
          partner_phone: string | null
          partner_user_id: string | null
          percentage: number
          product_id: string
          split_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          partner_name: string
          partner_phone?: string | null
          partner_user_id?: string | null
          percentage: number
          product_id: string
          split_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          partner_name?: string
          partner_phone?: string | null
          partner_user_id?: string | null
          percentage?: number
          product_id?: string
          split_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_partners_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_units: {
        Row: {
          conversion_factor: number
          cost_price_per_unit: number | null
          created_at: string
          id: string
          is_active: boolean
          is_default_buy: boolean
          is_default_sell: boolean
          product_id: string
          selling_price: number | null
          unit_code: string
          updated_at: string
        }
        Insert: {
          conversion_factor: number
          cost_price_per_unit?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default_buy?: boolean
          is_default_sell?: boolean
          product_id: string
          selling_price?: number | null
          unit_code: string
          updated_at?: string
        }
        Update: {
          conversion_factor?: number
          cost_price_per_unit?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default_buy?: boolean
          is_default_sell?: boolean
          product_id?: string
          selling_price?: number | null
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_units_unit_code_fkey"
            columns: ["unit_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["code"]
          },
        ]
      }
      products: {
        Row: {
          addons: Json | null
          affiliate_commission_pct: number
          badge: string | null
          brand: string | null
          category: string
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          description: string | null
          description_i18n: Json | null
          fulfillment_type: string
          id: string
          image: string | null
          image_path: string | null
          image_url: string | null
          is_active: boolean
          metadata: Json
          name: string
          name_i18n: Json | null
          old_price: number | null
          packaging_cost: number | null
          perishable: boolean | null
          price: number
          rating: number | null
          selling_price: number | null
          sort_order: number
          source: string
          stock: number
          store_id: string | null
          sub_category: string | null
          unit: string
          updated_at: string
          variants: Json | null
          vendor_id: string | null
        }
        Insert: {
          addons?: Json | null
          affiliate_commission_pct?: number
          badge?: string | null
          brand?: string | null
          category?: string
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          fulfillment_type?: string
          id: string
          image?: string | null
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          metadata?: Json
          name: string
          name_i18n?: Json | null
          old_price?: number | null
          packaging_cost?: number | null
          perishable?: boolean | null
          price?: number
          rating?: number | null
          selling_price?: number | null
          sort_order?: number
          source?: string
          stock?: number
          store_id?: string | null
          sub_category?: string | null
          unit?: string
          updated_at?: string
          variants?: Json | null
          vendor_id?: string | null
        }
        Update: {
          addons?: Json | null
          affiliate_commission_pct?: number
          badge?: string | null
          brand?: string | null
          category?: string
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          fulfillment_type?: string
          id?: string
          image?: string | null
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          metadata?: Json
          name?: string
          name_i18n?: Json | null
          old_price?: number | null
          packaging_cost?: number | null
          perishable?: boolean | null
          price?: number
          rating?: number | null
          selling_price?: number | null
          sort_order?: number
          source?: string
          stock?: number
          store_id?: string | null
          sub_category?: string | null
          unit?: string
          updated_at?: string
          variants?: Json | null
          vendor_id?: string | null
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
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          birth_date: string | null
          branch_id: string | null
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
          preferred_locale: string | null
          updated_at: string
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          branch_id?: string | null
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
          preferred_locale?: string | null
          updated_at?: string
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          branch_id?: string | null
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
          preferred_locale?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          notes: string | null
          paid_amount: number
          remaining: number | null
          status: string
          subtotal: number
          supplier_id: string
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number
          remaining?: number | null
          status?: string
          subtotal?: number
          supplier_id: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number
          remaining?: number | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          line_total: number | null
          product_id: string | null
          product_name: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          line_total?: number | null
          product_id?: string | null
          product_name: string
          quantity: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          line_total?: number | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      riba_audit_log: {
        Row: {
          amount: number | null
          category: string
          created_at: string
          description: string
          id: string
          recommendation: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          source_id: string
          source_table: string
          status: string
        }
        Insert: {
          amount?: number | null
          category: string
          created_at?: string
          description: string
          id?: string
          recommendation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          source_id: string
          source_table: string
          status?: string
        }
        Update: {
          amount?: number | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          recommendation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          source_id?: string
          source_table?: string
          status?: string
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
      staff_advance_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          created_at: string
          id: string
          kind: string
          reason: string
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          kind: string
          reason: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          reason?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_advance_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          branch_id: string | null
          check_in_at: string
          check_in_lat: number | null
          check_in_lng: number | null
          check_out_at: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          check_in_at?: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          check_in_at?: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
          branch_id: string | null
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
          branch_id?: string | null
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
          branch_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "stores_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      suppliers: {
        Row: {
          address: string | null
          branch_id: string | null
          closing_day: number | null
          collection_days: number[] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          outstanding_balance: number
          payment_terms_days: number | null
          total_paid: number
          total_purchased: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          closing_day?: number | null
          collection_days?: number[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          outstanding_balance?: number
          payment_terms_days?: number | null
          total_paid?: number
          total_purchased?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          closing_day?: number | null
          collection_days?: number[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          outstanding_balance?: number
          payment_terms_days?: number | null
          total_paid?: number
          total_purchased?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          message: string | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          message?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          message?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      units_of_measure: {
        Row: {
          code: string
          created_at: string
          id: string
          is_base: boolean
          name_ar: string
          name_en: string | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_base?: boolean
          name_ar: string
          name_en?: string | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_base?: boolean
          name_ar?: string
          name_en?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      user_behavior_logs: {
        Row: {
          category: string | null
          created_at: string
          dwell_ms: number | null
          event_type: string
          id: string
          product_id: string | null
          query: string | null
          session_id: string | null
          user_id: string | null
          weight: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          dwell_ms?: number | null
          event_type: string
          id?: string
          product_id?: string | null
          query?: string | null
          session_id?: string | null
          user_id?: string | null
          weight?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          dwell_ms?: number | null
          event_type?: string
          id?: string
          product_id?: string | null
          query?: string | null
          session_id?: string | null
          user_id?: string | null
          weight?: number
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          avg_order_value: number | null
          created_at: string
          frequent_products: Json
          last_refreshed_at: string
          price_sensitivity: string
          top_categories: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_order_value?: number | null
          created_at?: string
          frequent_products?: Json
          last_refreshed_at?: string
          price_sensitivity?: string
          top_categories?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_order_value?: number | null
          created_at?: string
          frequent_products?: Json
          last_refreshed_at?: string
          price_sensitivity?: string
          top_categories?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          notes: string | null
          performed_by: string
          performed_by_name: string | null
          period_end: string | null
          period_start: string | null
          reference: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          performed_by: string
          performed_by_name?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          performed_by?: string
          performed_by_name?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_wallets: {
        Row: {
          available_balance: number
          lifetime_earned: number
          lifetime_paid_out: number
          pending_balance: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          available_balance?: number
          lifetime_earned?: number
          lifetime_paid_out?: number
          pending_balance?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          available_balance?: number
          lifetime_earned?: number
          lifetime_paid_out?: number
          pending_balance?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_wallets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          branch_id: string | null
          commission_pct: number
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_user_id: string | null
          payout_details: Json | null
          payout_method: string | null
          slug: string
          updated_at: string
          vendor_type: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          commission_pct?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_user_id?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          slug: string
          updated_at?: string
          vendor_type?: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          commission_pct?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_user_id?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          slug?: string
          updated_at?: string
          vendor_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
      wallet_topup_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          method: string
          note: string | null
          performed_by: string
          performed_by_name: string | null
          rejection_reason: string | null
          status: string
          transfer_reference: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          method: string
          note?: string | null
          performed_by: string
          performed_by_name?: string | null
          rejection_reason?: string | null
          status?: string
          transfer_reference: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          performed_by?: string
          performed_by_name?: string | null
          rejection_reason?: string | null
          status?: string
          transfer_reference?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by_admin: string | null
          id: string
          kind: string
          label: string
          reference_order_id: string | null
          source: string | null
          status: string
          user_id: string
          vest_release_at: string | null
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by_admin?: string | null
          id?: string
          kind?: string
          label: string
          reference_order_id?: string | null
          source?: string | null
          status?: string
          user_id: string
          vest_release_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by_admin?: string | null
          id?: string
          kind?: string
          label?: string
          reference_order_id?: string | null
          source?: string | null
          status?: string
          user_id?: string
          vest_release_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          branch_id: string | null
          city: string | null
          code: string
          created_at: string
          district: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          priority: number
          served_zones: string[]
          updated_at: string
          vendor_id: string | null
          warehouse_type: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          code: string
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          priority?: number
          served_zones?: string[]
          updated_at?: string
          vendor_id?: string | null
          warehouse_type?: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          code?: string
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          priority?: number
          served_zones?: string[]
          updated_at?: string
          vendor_id?: string | null
          warehouse_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      zakat_assessments: {
        Row: {
          cash_balances: number
          computed_by: string | null
          created_at: string
          id: string
          inventory_market_value: number
          is_above_nisab: boolean
          liabilities: number
          nisab_value: number
          notes: string | null
          period_end: string
          period_start: string
          receivables: number
          status: string
          zakat_base: number
          zakat_due: number
        }
        Insert: {
          cash_balances?: number
          computed_by?: string | null
          created_at?: string
          id?: string
          inventory_market_value?: number
          is_above_nisab?: boolean
          liabilities?: number
          nisab_value?: number
          notes?: string | null
          period_end: string
          period_start: string
          receivables?: number
          status?: string
          zakat_base?: number
          zakat_due?: number
        }
        Update: {
          cash_balances?: number
          computed_by?: string | null
          created_at?: string
          id?: string
          inventory_market_value?: number
          is_above_nisab?: boolean
          liabilities?: number
          nisab_value?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          receivables?: number
          status?: string
          zakat_base?: number
          zakat_due?: number
        }
        Relationships: []
      }
      zone_availability: {
        Row: {
          branch_id: string | null
          category_id: string | null
          created_at: string
          id: string
          is_available: boolean
          product_id: string | null
          zone_id: string
        }
        Insert: {
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          product_id?: string | null
          zone_id: string
        }
        Update: {
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          product_id?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_availability_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_availability_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_topup_wallet: {
        Args: {
          _amount: number
          _method: string
          _note?: string
          _transfer_reference: string
          _user_id: string
        }
        Returns: Json
      }
      allocate_order_inventory: {
        Args: { _order_id: string; _zone?: string }
        Returns: Json
      }
      allocation_overview: { Args: { _order_id: string }; Returns: Json }
      approve_advance_request: { Args: { _request_id: string }; Returns: Json }
      approve_wallet_topup: { Args: { _topup_id: string }; Returns: Json }
      auto_route_order_to_branch: {
        Args: {
          _order_id: string
          _product_id: string
          _qty_pieces: number
          _target_branch: string
        }
        Returns: Json
      }
      category_affinity: {
        Args: { _user_id: string }
        Returns: {
          category: string
          score: number
        }[]
      }
      cfo_dashboard_stats: { Args: never; Returns: Json }
      commit_sub_order_stock: { Args: { _sub_order_id: string }; Returns: Json }
      complete_delivery: {
        Args: {
          _cod_collected?: boolean
          _lat?: number
          _lng?: number
          _scanned_barcode?: string
          _task_id: string
        }
        Returns: Json
      }
      compute_charity_dues: {
        Args: { _end: string; _start: string }
        Returns: Json
      }
      compute_driver_commission: {
        Args: { _driver_id: string; _order_total: number }
        Returns: number
      }
      compute_user_level: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_user_level"]
      }
      compute_zakat_assessment: {
        Args: { _nisab_value?: number }
        Returns: Json
      }
      convert_to_pieces: {
        Args: { _product_id: string; _qty: number; _unit_code: string }
        Returns: number
      }
      current_mega_event: { Args: never; Returns: Json }
      current_user_branch_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      driver_log_event: {
        Args: { _event: string; _lat?: number; _lng?: number; _task_id: string }
        Returns: Json
      }
      driver_portal_stats: { Args: never; Returns: Json }
      driver_settle_cash: {
        Args: {
          _amount: number
          _bank_reference?: string
          _driver_id: string
          _kind?: string
          _notes?: string
        }
        Returns: Json
      }
      ensure_referral_code: { Args: { _user_id: string }; Returns: string }
      executive_dashboard_stats: { Args: { _days?: number }; Returns: Json }
      financial_snapshot: { Args: { _days?: number }; Returns: Json }
      find_allocation_warehouse: {
        Args: { _product_id: string; _qty: number; _zone: string }
        Returns: {
          available_stock: number
          priority: number
          vendor_id: string
          warehouse_id: string
          warehouse_type: string
        }[]
      }
      frequently_bought_together: {
        Args: { _limit?: number; _product_ids: string[] }
        Returns: {
          category: string
          product_id: string
          product_name: string
          score: number
        }[]
      }
      hakim_deep_report: {
        Args: { _from?: string; _to?: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      home_layout: { Args: { _user_id?: string }; Returns: Json }
      i18n_text: {
        Args: { _fallback: string; _i18n: Json; _locale?: string }
        Returns: string
      }
      is_product_available_in_zone: {
        Args: { _product_id: string; _zone_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      log_behavior: {
        Args: {
          _category?: string
          _dwell_ms?: number
          _event: string
          _product_id?: string
          _query?: string
        }
        Returns: string
      }
      low_stock_products: {
        Args: { _threshold?: number }
        Returns: {
          category: string
          id: string
          image_url: string
          name: string
          price: number
          stock: number
        }[]
      }
      nested_stock_breakdown: { Args: { _product_id: string }; Returns: Json }
      payments_schedule: { Args: { _days_ahead?: number }; Returns: Json }
      personalized_flash_picks: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          category: string
          original_price: number
          product_id: string
          product_name: string
          reason: string
          suggested_discount_pct: number
        }[]
      }
      process_commission_vesting: { Args: never; Returns: Json }
      progress_to_next_level: { Args: { _user_id: string }; Returns: Json }
      recompute_wallet_balance: { Args: { _user: string }; Returns: number }
      redeem_coupon: {
        Args: { _code: string; _order_id: string; _order_total: number }
        Returns: Json
      }
      refresh_user_preferences: { Args: { _user_id?: string }; Returns: Json }
      reject_advance_request: {
        Args: { _reason: string; _request_id: string }
        Returns: Json
      }
      reject_wallet_topup: {
        Args: { _reason: string; _topup_id: string }
        Returns: Json
      }
      release_order_reservation: { Args: { _order_id: string }; Returns: Json }
      resolve_fulfillment: {
        Args: { _branch_id: string; _product_id: string; _zone?: string }
        Returns: Json
      }
      rotate_flash_sale: { Args: never; Returns: string }
      rotate_flash_sale_v2: { Args: never; Returns: Json }
      same_branch: { Args: { _branch_id: string }; Returns: boolean }
      scan_riba_suspicions: { Args: never; Returns: Json }
      settle_vendor_payout: {
        Args: {
          _amount: number
          _method: string
          _notes?: string
          _reference: string
          _vendor_id: string
        }
        Returns: Json
      }
      user_branch_ids: { Args: { _user_id: string }; Returns: string[] }
      user_store_ids: { Args: { _user_id: string }; Returns: string[] }
      user_total_spent: { Args: { _user_id: string }; Returns: number }
      user_trust_limit: { Args: { _user_id: string }; Returns: number }
      user_vendor_ids: { Args: { _user_id: string }; Returns: string[] }
      validate_coupon: {
        Args: { _code: string; _order_total: number }
        Returns: Json
      }
      validate_discount: {
        Args: { _cost_price: number; _new_price: number; _sale_price: number }
        Returns: Json
      }
      validate_unit_pricing: {
        Args: {
          _product_id: string
          _selling_price: number
          _unit_code: string
        }
        Returns: Json
      }
      vendor_portal_stats: { Args: never; Returns: Json }
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
        | "vendor"
        | "branch_manager"
        | "inventory_clerk"
      app_user_level: "bronze" | "silver" | "gold" | "platinum"
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
        "vendor",
        "branch_manager",
        "inventory_clerk",
      ],
      app_user_level: ["bronze", "silver", "gold", "platinum"],
    },
  },
} as const
