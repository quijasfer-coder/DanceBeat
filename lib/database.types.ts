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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audition_applications: {
        Row: {
          age: number | null
          created_at: string
          email: string
          experience: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["audition_status"]
          styles: string | null
          updated_at: string
          video_url: string | null
          why_impulse: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          email: string
          experience?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["audition_status"]
          styles?: string | null
          updated_at?: string
          video_url?: string | null
          why_impulse?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["audition_status"]
          styles?: string | null
          updated_at?: string
          video_url?: string | null
          why_impulse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audition_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          attended_at: string | null
          attended_by: string | null
          booked_at: string
          cancelled_at: string | null
          created_at: string
          credit_charged: boolean
          credit_returned: boolean
          id: string
          is_fixed: boolean
          notes: string | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attended_at?: string | null
          attended_by?: string | null
          booked_at?: string
          cancelled_at?: string | null
          created_at?: string
          credit_charged?: boolean
          credit_returned?: boolean
          id?: string
          is_fixed?: boolean
          notes?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attended_at?: string | null
          attended_by?: string | null
          booked_at?: string
          cancelled_at?: string | null
          created_at?: string
          credit_charged?: boolean
          credit_returned?: boolean
          id?: string
          is_fixed?: boolean
          notes?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_attended_by_fkey"
            columns: ["attended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          cancellation_reason: string | null
          capacity_override: number | null
          class_id: string
          created_at: string
          ends_at: string
          id: string
          seats_taken: number
          session_date: string
          starts_at: string
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          capacity_override?: number | null
          class_id: string
          created_at?: string
          ends_at: string
          id?: string
          seats_taken?: number
          session_date: string
          starts_at: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          capacity_override?: number | null
          class_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          seats_taken?: number
          session_date?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_max: number | null
          age_min: number | null
          capacity: number
          created_at: string
          day_of_week: number
          duration_min: number
          id: string
          is_active: boolean
          is_public: boolean
          level: Database["public"]["Enums"]["dance_level"]
          starts_at_time: string
          studio_id: string
          style_id: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          capacity: number
          created_at?: string
          day_of_week: number
          duration_min?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          level?: Database["public"]["Enums"]["dance_level"]
          starts_at_time: string
          studio_id: string
          style_id: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          capacity?: number
          created_at?: string
          day_of_week?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          level?: Database["public"]["Enums"]["dance_level"]
          starts_at_time?: string
          studio_id?: string
          style_id?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_assignments: {
        Row: {
          attended_at: string | null
          attended_by: string | null
          created_at: string
          event_id: string
          id: string
          marked_paid_by: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["event_payment_status"]
          status: Database["public"]["Enums"]["event_assignment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attended_at?: string | null
          attended_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          marked_paid_by?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["event_payment_status"]
          status?: Database["public"]["Enums"]["event_assignment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attended_at?: string | null
          attended_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          marked_paid_by?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["event_payment_status"]
          status?: Database["public"]["Enums"]["event_assignment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_attended_by_fkey"
            columns: ["attended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_marked_paid_by_fkey"
            columns: ["marked_paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cost_cents: number | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_published: boolean
          kind: Database["public"]["Enums"]["event_kind"]
          location: string | null
          requirements: string | null
          starts_at: string
          studio_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          requirements?: string | null
          starts_at: string
          studio_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          requirements?: string | null
          starts_at?: string
          studio_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_albums: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          display_order: number
          drive_url: string
          event_date: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          drive_url: string
          event_date?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          drive_url?: string
          event_date?: string | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_id: string
          amount_cents: number
          base_amount_cents: number | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          late_fee_cents: number | null
          method: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          student_id: string | null
          subscription_id: string | null
        }
        Insert: {
          account_id: string
          amount_cents: number
          base_amount_cents?: number | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          late_fee_cents?: number | null
          method?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          account_id?: string
          amount_cents?: number
          base_amount_cents?: number | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          late_fee_cents?: number | null
          method?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          cadence: string
          classes_per_week: number | null
          code: string
          created_at: string
          credits_per_month: number | null
          display_order: number
          featured: boolean
          id: string
          is_active: boolean
          name: string
          perks: Json
          price_cents: number
          stripe_price_id: string | null
          tagline: string | null
        }
        Insert: {
          cadence?: string
          classes_per_week?: number | null
          code: string
          created_at?: string
          credits_per_month?: number | null
          display_order?: number
          featured?: boolean
          id?: string
          is_active?: boolean
          name: string
          perks?: Json
          price_cents: number
          stripe_price_id?: string | null
          tagline?: string | null
        }
        Update: {
          cadence?: string
          classes_per_week?: number | null
          code?: string
          created_at?: string
          credits_per_month?: number | null
          display_order?: number
          featured?: boolean
          id?: string
          is_active?: boolean
          name?: string
          perks?: Json
          price_cents?: number
          stripe_price_id?: string | null
          tagline?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          enrolled_at: string | null
          enrollment_paid_by: string | null
          enrollment_paid_method: string | null
          full_name: string
          id: string
          phone: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          enrolled_at?: string | null
          enrollment_paid_by?: string | null
          enrollment_paid_method?: string | null
          full_name: string
          id: string
          phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          enrolled_at?: string | null
          enrollment_paid_by?: string | null
          enrollment_paid_method?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_enrollment_paid_by_fkey"
            columns: ["enrollment_paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          account_id: string
          birthdate: string
          created_at: string
          curp_pdf_path: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enrolled_at: string | null
          enrollment_paid_by: string | null
          enrollment_paid_method: string | null
          enrollment_type_id: string | null
          father_name: string | null
          father_phone: string | null
          full_name: string
          grade: string | null
          id: string
          is_active: boolean
          is_self: boolean
          mother_name: string | null
          mother_phone: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          photo_video_consent: boolean
          photo_video_consent_at: string | null
          school: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          birthdate: string
          created_at?: string
          curp_pdf_path?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrolled_at?: string | null
          enrollment_paid_by?: string | null
          enrollment_paid_method?: string | null
          enrollment_type_id?: string | null
          father_name?: string | null
          father_phone?: string | null
          full_name: string
          grade?: string | null
          id?: string
          is_active?: boolean
          is_self?: boolean
          mother_name?: string | null
          mother_phone?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          photo_video_consent?: boolean
          photo_video_consent_at?: string | null
          school?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          birthdate?: string
          created_at?: string
          curp_pdf_path?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrolled_at?: string | null
          enrollment_paid_by?: string | null
          enrollment_paid_method?: string | null
          enrollment_type_id?: string | null
          father_name?: string | null
          father_phone?: string | null
          full_name?: string
          grade?: string | null
          id?: string
          is_active?: boolean
          is_self?: boolean
          mother_name?: string | null
          mother_phone?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          photo_video_consent?: boolean
          photo_video_consent_at?: string | null
          school?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_enrollment_paid_by_fkey"
            columns: ["enrollment_paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_enrollment_type_id_fkey"
            columns: ["enrollment_type_id"]
            isOneToOne: false
            referencedRelation: "enrollment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          neighborhood: string | null
          notes: string | null
          slug: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          neighborhood?: string | null
          notes?: string | null
          slug: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          neighborhood?: string | null
          notes?: string | null
          slug?: string
          zip?: string | null
        }
        Relationships: []
      }
      styles: {
        Row: {
          age_range: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          display_order: number
          duration_min: number
          id: string
          is_active: boolean
          name: string
          slug: string
          tagline: string | null
        }
        Insert: {
          age_range?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tagline?: string | null
        }
        Update: {
          age_range?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tagline?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          credits_remaining: number
          credits_total: number
          cycle_end_at: string
          cycle_start_at: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          credits_remaining?: number
          credits_total?: number
          cycle_end_at: string
          cycle_start_at: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          credits_remaining?: number
          credits_total?: number
          cycle_end_at?: string
          cycle_start_at?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio_internal: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          photo_url: string | null
          profile_id: string | null
        }
        Insert: {
          bio_internal?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
        }
        Update: {
          bio_internal?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          id: string
          joined_at: string
          position: number
          promoted_at: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          position: number
          promoted_at?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          position?: number
          promoted_at?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _autobook_fixed_enrollments_for_session: {
        Args: { p_session_id: string }
        Returns: number
      }
      _generate_class_sessions: {
        Args: { p_class_id: string; p_weeks_ahead?: number }
        Returns: number
      }
      approve_account: {
        Args: { p_account_id: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          enrolled_at: string | null
          enrollment_paid_by: string | null
          enrollment_paid_method: string | null
          full_name: string
          id: string
          phone: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_fixed_class: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: number
      }
      book_class: {
        Args: { p_session_id: string; p_student_id: string }
        Returns: {
          attended_at: string | null
          attended_by: string | null
          booked_at: string
          cancelled_at: string | null
          created_at: string
          credit_charged: boolean
          credit_returned: boolean
          id: string
          is_fixed: boolean
          notes: string | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bulk_assign_event_by_class: {
        Args: { p_class_id: string; p_event_id: string }
        Returns: number
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          attended_at: string | null
          attended_by: string | null
          booked_at: string
          cancelled_at: string | null
          created_at: string
          credit_charged: boolean
          credit_returned: boolean
          id: string
          is_fixed: boolean
          notes: string | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_class_sessions: {
        Args: { p_class_id: string; p_weeks_ahead?: number }
        Returns: number
      }
      generate_sessions_all_active_classes: {
        Args: { p_weeks_ahead?: number }
        Returns: {
          class_id: string
          sessions_created: number
        }[]
      }
      get_setting: {
        Args: { p_default?: string; p_key: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_teacher_of_class: { Args: { p_class_id: string }; Returns: boolean }
      is_teacher_of_session: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      mark_attendance: {
        Args: { p_attended: boolean; p_booking_id: string }
        Returns: {
          attended_at: string | null
          attended_by: string | null
          booked_at: string
          cancelled_at: string | null
          created_at: string
          credit_charged: boolean
          credit_returned: boolean
          id: string
          is_fixed: boolean
          notes: string | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_attendance_for_enrollment: {
        Args: {
          p_attended: boolean
          p_session_id: string
          p_student_id: string
        }
        Returns: {
          attended_at: string | null
          attended_by: string | null
          booked_at: string
          cancelled_at: string | null
          created_at: string
          credit_charged: boolean
          credit_returned: boolean
          id: string
          is_fixed: boolean
          notes: string | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_enrollment_paid: {
        Args: { p_method: string; p_student_id: string }
        Returns: {
          account_id: string
          birthdate: string
          created_at: string
          curp_pdf_path: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enrolled_at: string | null
          enrollment_paid_by: string | null
          enrollment_paid_method: string | null
          enrollment_type_id: string | null
          father_name: string | null
          father_phone: string | null
          full_name: string
          grade: string | null
          id: string
          is_active: boolean
          is_self: boolean
          mother_name: string | null
          mother_phone: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          photo_video_consent: boolean
          photo_video_consent_at: string | null
          school: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      owns_student: { Args: { p_student_id: string }; Returns: boolean }
      promote_from_waitlist: {
        Args: { p_session_id: string }
        Returns: {
          attended_at: string | null
          attended_by: string | null
          booked_at: string
          cancelled_at: string | null
          created_at: string
          credit_charged: boolean
          credit_returned: boolean
          id: string
          is_fixed: boolean
          notes: string | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_account: {
        Args: { p_account_id: string; p_reason?: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          enrolled_at: string | null
          enrollment_paid_by: string | null
          enrollment_paid_method: string | null
          full_name: string
          id: string
          phone: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unassign_fixed_class: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: number
      }
    }
    Enums: {
      account_status: "pending" | "approved" | "rejected"
      audition_status:
        | "received"
        | "reviewing"
        | "shortlist"
        | "accepted"
        | "rejected"
        | "withdrawn"
      booking_status:
        | "confirmed"
        | "cancelled"
        | "cancelled_late"
        | "attended"
        | "no_show"
      dance_level: "principiante" | "intermedio" | "avanzado" | "abierto"
      event_assignment_status:
        | "invited"
        | "confirmed"
        | "declined"
        | "attended"
        | "no_show"
      event_kind: "rehearsal" | "competition" | "showcase" | "other"
      event_payment_status: "not_required" | "pending" | "paid"
      payment_kind: "enrollment" | "monthly" | "drop_in" | "late_fee" | "refund"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      session_status: "scheduled" | "cancelled" | "completed"
      subscription_status: "active" | "past_due" | "cancelled" | "paused"
      user_role: "student" | "teacher" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["pending", "approved", "rejected"],
      audition_status: [
        "received",
        "reviewing",
        "shortlist",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      booking_status: [
        "confirmed",
        "cancelled",
        "cancelled_late",
        "attended",
        "no_show",
      ],
      dance_level: ["principiante", "intermedio", "avanzado", "abierto"],
      event_assignment_status: [
        "invited",
        "confirmed",
        "declined",
        "attended",
        "no_show",
      ],
      event_kind: ["rehearsal", "competition", "showcase", "other"],
      event_payment_status: ["not_required", "pending", "paid"],
      payment_kind: ["enrollment", "monthly", "drop_in", "late_fee", "refund"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      session_status: ["scheduled", "cancelled", "completed"],
      subscription_status: ["active", "past_due", "cancelled", "paused"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
