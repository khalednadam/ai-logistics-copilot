CREATE TYPE "public"."incoterm" AS ENUM('DDP', 'DDU');--> statement-breakpoint
CREATE TYPE "public"."origin_hub" AS ENUM('shenzhen', 'yiwu');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('label_created', 'in_transit', 'customs_hold', 'out_for_delivery', 'delivered', 'exception', 'returned');--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_email" text NOT NULL,
	"country" char(2) NOT NULL,
	CONSTRAINT "merchants_contactEmail_unique" UNIQUE("contact_email")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"order_id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"origin_hub" "origin_hub" NOT NULL,
	"destination_country" char(2) NOT NULL,
	"status" "shipment_status" NOT NULL,
	"carrier" text NOT NULL,
	"tracking_number" text NOT NULL,
	"incoterm" "incoterm" NOT NULL,
	"declared_value_cents" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"items" jsonb NOT NULL,
	"estimated_delivery" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_trackingNumber_unique" UNIQUE("tracking_number")
);
--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;