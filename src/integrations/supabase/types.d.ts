// Temporary ambient type definitions for the database
// This file will be replaced automatically when backend types sync runs.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = any;
