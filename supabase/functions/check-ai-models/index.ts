import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";
import { createHandler } from "./handler.ts";

Deno.serve(createHandler(createClient, nodemailer));
