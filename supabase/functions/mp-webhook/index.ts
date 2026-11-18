import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer"
import { createHandler } from "./handler.ts"

serve(createHandler(createClient, (options) => nodemailer.createTransport(options)))
