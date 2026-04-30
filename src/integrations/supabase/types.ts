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
      approve_wallet_topup: { Args: { _topup_id: string }; Returns: Json }
      cfo_dashboard_stats: { Args: never; Returns: Json }
      commit_sub_order_stock: { Args: { _sub_order_id: string }; Returns: Json }
      ensure_referral_code: { Args: { _user_id: string }; Returns: string }
      executive_dashboard_stats: { Args: { _days?: number }; Returns: Json }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      i18n_text: {
        Args: { _fallback: string; _i18n: Json; _locale?: string }
        Returns: string
      }
      is_product_available_in_zone: {
        Args: { _product_id: string; _zone_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
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
      process_commission_vesting: { Args: never; Returns: Json }
      recompute_wallet_balance: { Args: { _user: string }; Returns: number }
      reject_wallet_topup: {
        Args: { _reason: string; _topup_id: string }
        Returns: Json
      }
      release_order_reservation: { Args: { _order_id: string }; Returns: Json }
      resolve_fulfillment: {
        Args: { _branch_id: string; _product_id: string; _zone?: string }
        Returns: Json
      }
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
      validate_discount: {
        Args: { _cost_price: number; _new_price: number; _sale_price: number }
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
      ],
    },
  },
} as const
