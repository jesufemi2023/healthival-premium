import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getSupabaseAdmin } from "./src/services/supabaseAdmin.js";
import { NotificationService } from "./src/services/notificationService.js";
import { getAIService } from "./src/services/ai/AIService.js";
import { getCloudinaryService } from "./src/services/cloudinary/CloudinaryService.js";
import { CONFIG } from "./src/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function slugify(text: string) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');   // Replace multiple - with single -
}

export async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Supabase Admin
  let supabase: any;
  try {
    supabase = getSupabaseAdmin();
    if (supabase) {
      console.log("Supabase Admin Initialized Successfully");
      
      // One-time Migration: Ensure all blog posts have slugs
      (async () => {
        try {
          // Check blog slugs
          const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('id, title, slug');
          
          if (error) {
            if (error.message.includes('column "slug" does not exist')) {
              console.warn("MIGRATION WARNING: 'slug' column is missing in 'blog_posts' table. Please run the SQL migration in Supabase.");
            } else {
              console.error("Migration Fetch Error:", error);
            }
          } else {
            const postsToUpdate = posts?.filter((p: any) => !p.slug) || [];
            if (postsToUpdate.length > 0) {
              console.log(`MIGRATION: Updating ${postsToUpdate.length} blog posts with slugs...`);
              for (const post of postsToUpdate) {
                const slug = slugify(post.title);
                await supabase
                  .from('blog_posts')
                  .update({ slug })
                  .eq('id', post.id);
              }
              console.log("MIGRATION: Blog slugs updated successfully.");
            }
          }

          // Check settings table
          const { error: settingsError } = await supabase
            .from('settings')
            .select('key')
            .limit(1);
          
          if (settingsError && settingsError.message.includes('relation "settings" does not exist')) {
            console.warn("MIGRATION WARNING: 'settings' table is missing. Please run the SQL migration in Supabase to enable dynamic bank details.");
          }
        } catch (migErr) {
          console.error("Migration Logic Error:", migErr);
        }
      })();
    }
  } catch (e) {
    console.error("Supabase Initialization Error:", e);
  }

  // Global Product Cache for AI Context
  let globalProductCache: string = "";
  let lastProductFetch = 0;

  async function getProductContext() {
    if (!supabase) return "";
    
    // Refresh cache every 1 hour (3600000 ms)
    const CACHE_DURATION = 60 * 60 * 1000;
    
    if (Date.now() - lastProductFetch > CACHE_DURATION || !globalProductCache) {
      try {
        // Fetch ALL fields from products (removed is_active filter to prevent crashes)
        const { data: products, error: prodErr } = await supabase.from('products').select('*');
        if (prodErr) console.error("Products fetch error:", prodErr);
        
        // Fetch ALL fields from recommended_packages
        const { data: packages, error: packErr } = await supabase.from('recommended_packages').select('*');
        if (packErr) {
          console.error("Packages fetch error:", packErr);
        }
        
        // Fetch package_products to know what's inside the packages
        const { data: packageProducts, error: ppErr } = await supabase.from('package_products').select('package_id, product_id, quantity, products(name)');
        
        if (prodErr || packErr) {
          console.error("Database fetch error during AI context generation:", { prodErr, packErr });
          // If we have a cache, keep using it even if stale, otherwise we return empty
          if (globalProductCache) return globalProductCache;
        }

        // Fetch blog posts for context
        const { data: blogs } = await supabase.from('blog_posts').select('title, excerpt').limit(5);

        let context = "";
        
        // Add Company Info
        context += "--- COMPANY INFORMATION ---\n";
        context += `Name: ${CONFIG.company.name}\n`;
        context += `Description: GHT Healthcare is a leading provider of natural health supplements and wellness solutions in Nigeria. We specialize in traditional herbal medicine combined with modern science.\n`;
        context += `WhatsApp: ${CONFIG.company.phone}\n\n`;

        if (blogs && blogs.length > 0) {
          context += "--- RECENT BLOG POSTS ---\n";
          context += blogs.map(b => `- ${b.title}: ${b.excerpt}`).join('\n') + "\n\n";
        }

        if (products && products.length > 0) {
          context += "--- PRODUCTS ---\n";
          context += products.map((p: any) => {
            // Only keep essential fields to save tokens and speed up response
            const essential = {
              id: p.id,
              name: p.name,
              price: p.price_naira,
              desc: p.short_desc,
              benefits: p.health_benefits,
              usage: p.usage_instructions
            };
            return JSON.stringify(essential);
          }).join('\n');
        }
        
        if (packages && packages.length > 0) {
          context += "\n--- PACKAGES ---\n";
          context += packages.map((pkg: any) => {
            // Only keep essential fields
            const essential = {
              id: pkg.id,
              name: pkg.name,
              price: pkg.price,
              desc: pkg.description,
              benefits: pkg.health_benefits,
              symptoms: pkg.symptoms,
              is_combo: pkg.is_combo || false
            };
            
            // Find products in this package
            const included = packageProducts 
              ? packageProducts.filter((pp: any) => pp.package_id === pkg.id)
                  .map((pp: any) => `${pp.quantity}x ${pp.products?.name || 'Unknown Product'}`)
                  .join(', ')
              : 'N/A';
              
            return JSON.stringify({ ...essential, included });
          }).join('\n');
        }
        
        globalProductCache = context;
        lastProductFetch = Date.now();
      } catch (e) {
        console.error("Failed to fetch products for AI context:", e);
      }
    }
    return globalProductCache;
  }

  // Middleware to simulate RLS by checking the access_token header
  const getAccessToken = (req: express.Request) => req.headers['x-access-token'] as string;

  // Admin Auth Middleware
  const adminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const password = req.headers['x-admin-password'];
    const expectedPassword = process.env.ADMIN_PASSWORD || "your-secure-admin-password";
    
    if (password === expectedPassword) {
      next();
    } else {
      // Add a small delay to mitigate brute force
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.warn(`Unauthorized Admin Access Attempt. Provided: ${password ? '***' : 'none'}, Expected: ${expectedPassword ? 'set' : 'not set'}`);
      res.status(401).json({ error: "Unauthorized Admin Access" });
    }
  };

  // --- Health Check ---
  app.get("/api/health", async (req, res) => {
    const status: any = {
      status: "ok",
      supabase: !!supabase,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SERVICE_ROLE_KEY: !!process.env.SERVICE_ROLE_KEY,
      }
    };

    if (supabase) {
      try {
        const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if (error) {
          status.supabase_error = error.message;
        } else {
          status.supabase_connected = true;
          status.product_count = count || 0;
        }
      } catch (e: any) {
        status.supabase_error = e.message;
      }
    }

    res.json(status);
  });

  // --- Sync Check & Metadata ---
  async function updateSyncTimestamp() {
    if (!supabase) return;
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('app_metadata')
        .upsert({ id: 'global_sync', last_updated: now });
      
      if (error) {
        // If table doesn't exist, we might get an error. 
        // In a real app, we'd ensure the table exists via migration.
        console.warn("Sync Timestamp Update Error (Table might not exist):", error.message);
      }
    } catch (e) {
      console.error("Failed to update sync timestamp:", e);
    }
  }

  app.get("/api/sync-check", async (req, res) => {
    if (!supabase) return res.json({ last_updated: new Date().toISOString() });
    
    try {
      const { data, error } = await supabase
        .from('app_metadata')
        .select('last_updated')
        .eq('id', 'global_sync')
        .maybeSingle();
      
      if (error || !data) {
        // Fallback if table doesn't exist or no record
        return res.json({ last_updated: new Date(0).toISOString() });
      }
      
      res.json(data);
    } catch (e) {
      res.json({ last_updated: new Date(0).toISOString() });
    }
  });

  // --- Admin CRUD Routes ---
  
  // Settings API (Must be before generic admin routes)
  app.get("/api/settings", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Database not initialized" });
    const { data, error } = await supabase.from('settings').select('*');
    if (error) return res.status(500).json({ error: error.message });
    
    // Convert array to object for easier frontend use
    const settings = data.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    res.json(settings);
  });

  app.post("/api/admin/settings", adminAuth, async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Database not initialized" });
    const { settings } = req.body; // Expecting { key: value }
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: "Invalid settings format" });
    }

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    const { error } = await supabase.from('settings').upsert(updates);
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ success: true });
  });

  // Supabase Database Migration Assistant API
  app.post("/api/admin/migrate-supabase", adminAuth, async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Local Database not initialized" });
    
    const { oldSupabaseUrl, oldSupabaseKey } = req.body;
    if (!oldSupabaseUrl || !oldSupabaseKey) {
      return res.status(400).json({ error: "Old Supabase URL and Service Role Key are required." });
    }

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const oldSupabase = createClient(oldSupabaseUrl, oldSupabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const errors: string[] = [];
      const counts = {
        products: 0,
        packages: 0,
        junction: 0,
        blogs: 0
      };

      // 1. Fetch data from old database
      const { data: oldProducts, error: prodErr } = await oldSupabase
        .from("products")
        .select("*");
      
      if (prodErr) {
        errors.push(`Failed to fetch Products from old database: ${prodErr.message}`);
      }

      const { data: oldPackages, error: packErr } = await oldSupabase
        .from("recommended_packages")
        .select("*");

      if (packErr) {
        errors.push(`Failed to fetch Packages from old database: ${packErr.message}`);
      }

      const { data: oldJunction, error: juncErr } = await oldSupabase
        .from("package_products")
        .select("*");

      if (juncErr) {
        errors.push(`Failed to fetch Package-Product links from old database: ${juncErr.message}`);
      }

      const { data: oldBlogs, error: blogErr } = await oldSupabase
        .from("blog_posts")
        .select("*");

      if (blogErr) {
        errors.push(`Failed to fetch Blog Posts from old database: ${blogErr.message}`);
      }

      // If we could not fetch anything at all, return an error
      if (errors.length > 0 && !oldProducts && !oldPackages && !oldJunction && !oldBlogs) {
        return res.status(400).json({ 
          error: "Could not fetch any tables from the provided database. Verify the URL and Service Role Key.", 
          details: errors 
        });
      }

      // 1.5 Clear any existing template products/packages/blogs/orders inside the destination DB to preserve pristine IDs and avoid UNIQUE or FOREIGN KEY constraints violations
      try {
        await supabase.from("package_products").delete().neq("package_id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("blog_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("consultations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("recommended_packages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      } catch (cleanError: any) {
        console.warn("Clean reset warn:", cleanError);
        errors.push(`Pre-migration table cleaning warning: ${cleanError?.message || cleanError}`);
      }

      // 2. Perform upserts into new database in order of dependencies (FKeys)

      // A. PRODUCTS
      if (oldProducts && oldProducts.length > 0) {
        const cleanProducts = oldProducts.map((p: any) => ({
          id: p.id,
          product_code: p.product_code || `PROD-${p.id.slice(0, 8)}`,
          name: p.name,
          short_desc: p.short_desc,
          long_desc: p.long_desc,
          health_benefits: Array.isArray(p.health_benefits) ? p.health_benefits : [],
          package: p.package,
          usage: p.usage,
          ingredients: p.ingredients,
          warning: p.warning,
          price_naira: Number(p.price_naira) || 0,
          discount_percent: Number(p.discount_percent) || 0,
          nafdac_no: p.nafdac_no,
          image_url: p.image_url,
          image_desc_url: p.image_desc_url,
          stock_quantity: p.stock_quantity !== undefined ? Number(p.stock_quantity) : 100,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString()
        }));

        const { error: localProdErr } = await supabase
          .from("products")
          .upsert(cleanProducts, { onConflict: "id" });

        if (localProdErr) {
          errors.push(`Products upsert failed: ${localProdErr.message}`);
        } else {
          counts.products = cleanProducts.length;
        }
      }

      // B. RECOMMENDED PACKAGES
      if (oldPackages && oldPackages.length > 0) {
        const cleanPackages = oldPackages.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: Number(p.price) || 0,
          discount: Number(p.discount) || 0,
          package_image_url: p.package_image_url,
          health_benefits: Array.isArray(p.health_benefits) ? p.health_benefits : [],
          symptoms: Array.isArray(p.symptoms) ? p.symptoms : [],
          package_code: p.package_code || `PKG-${p.id.slice(0, 8)}`,
          is_combo: p.is_combo === true || p.is_combo === 'true' || p.is_combo === 1,
          options: p.options || [],
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString()
        }));

        const { error: localPackErr } = await supabase
          .from("recommended_packages")
          .upsert(cleanPackages, { onConflict: "id" });

        if (localPackErr) {
          errors.push(`Packages upsert failed: ${localPackErr.message}`);
        } else {
          counts.packages = cleanPackages.length;
        }
      }

      // C. PACKAGE PRODUCTS
      if (oldJunction && oldJunction.length > 0) {
        const cleanJunction = oldJunction
          .filter((j: any) => j.package_id && j.product_id)
          .map((j: any) => ({
            package_id: j.package_id,
            product_id: j.product_id
          }));

        if (cleanJunction.length > 0) {
          const { error: localJuncErr } = await supabase
            .from("package_products")
            .upsert(cleanJunction, { onConflict: "package_id,product_id" });

          if (localJuncErr) {
            errors.push(`Package-Product relationships upsert failed: ${localJuncErr.message}`);
          } else {
            counts.junction = cleanJunction.length;
          }
        }
      }

      // D. BLOG POSTS
      if (oldBlogs && oldBlogs.length > 0) {
        const cleanBlogs = oldBlogs.map((b: any) => ({
          id: b.id,
          title: b.title,
          slug: b.slug || b.id,
          content: b.content,
          meta_description: b.meta_description,
          category: b.category,
          tags: Array.isArray(b.tags) ? b.tags : [],
          image_url: b.image_url,
          recommended_package_id: b.recommended_package_id || null,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString()
        }));

        const { error: localBlogErr } = await supabase
          .from("blog_posts")
          .upsert(cleanBlogs, { onConflict: "id" });

        if (localBlogErr) {
          errors.push(`Blogs upsert failed: ${localBlogErr.message}`);
        } else {
          counts.blogs = cleanBlogs.length;
        }
      }

      if (errors.length > 0 && counts.products === 0 && counts.packages === 0 && counts.blogs === 0) {
        return res.status(500).json({ 
          error: "Migration failed to store retrieved records dynamically.", 
          details: errors 
        });
      }

      await updateSyncTimestamp();

      return res.json({
        success: true,
        message: "Automated migration finished completely and records successfully saved!",
        counts,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (err: any) {
      console.error("Migration fatal error:", err);
      return res.status(500).json({ error: "Fatal execution error", details: err.message });
    }
  });

  // Generic Admin GET
  app.get("/api/admin/:table", adminAuth, async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not configured" });
    const { table } = req.params;
    
    let query;
    
    // Special handling for some tables to include joined data
    if (table === 'orders') {
      query = supabase.from(table).select(`
        *,
        profiles ( full_name, phone_number ),
        order_items (
          id,
          quantity,
          price_at_time,
          products ( name, product_code )
        )
      `).order('created_at', { ascending: false });
    } else if (table === 'consultations') {
      query = supabase.from(table).select(`
        *,
        profiles ( full_name, phone_number )
      `).order('created_at', { ascending: false });
    } else if (table === 'recommended_packages') {
      query = supabase.from(table).select(`
        *,
        package_products (
          product_id,
          products ( name, product_code )
        )
      `).order('created_at', { ascending: false });
    } else {
      query = supabase.from(table).select('*');
      // Only order by created_at if it's likely to exist (not settings or junction tables)
      if (!["settings", "package_products", "api_keys_status", "app_metadata"].includes(table)) {
        query = query.order('created_at', { ascending: false });
      }
    }
    
    const { data, error } = await query;
    if (error) {
      console.error(`Database Error fetching ${table}:`, error);
      return res.status(500).json({ error: error.message, details: error.hint });
    }
    res.json(data);
  });

  // Specific route for product images base64 (MUST be before generic /api/admin/:table)
  app.post("/api/admin/product-images-base64", adminAuth, async (req, res) => {
    const { product_ids } = req.body;
    if (!product_ids || !Array.isArray(product_ids)) {
      return res.status(400).json({ error: "product_ids array is required" });
    }

    if (!supabase) return res.status(503).json({ error: "Database not configured" });

    try {
      // Filter out invalid UUIDs to prevent PostgreSQL "invalid input syntax for type uuid" errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validProductIds = product_ids.filter(id => id && typeof id === 'string' && uuidRegex.test(id));

      if (validProductIds.length === 0) {
        return res.json({ images: [] });
      }

      const { data: products, error } = await supabase
        .from('products')
        .select('name, image_url')
        .in('id', validProductIds);

      if (error) throw error;

      const images: { name: string, base64: string, mimeType: string }[] = [];
      
      // We'll use the first 3 images as reference to avoid overloading AI context
      const referenceProducts = (products || []).filter(p => p.image_url).slice(0, 3);

      for (const prod of referenceProducts) {
        try {
          let url = prod.image_url;
          if (url.startsWith('/')) {
            url = `http://localhost:3000${url}`;
          } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `http://localhost:3000/${url}`;
          }
          const imgRes = await fetch(url);
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = imgRes.headers.get('content-type') || 'image/png';
            images.push({
              name: prod.name,
              base64,
              mimeType
            });
          } else {
            console.error(`Failed to fetch image for ${prod.name}: ${imgRes.status} ${imgRes.statusText}`);
          }
        } catch (e) {
          console.error(`Failed to fetch image for ${prod.name}`, e);
        }
      }

      res.json({ images });
    } catch (e: any) {
      console.error("Product images base64 error:", e);
      res.status(500).json({ error: e.message });
    }
  });



  // Specific route for AI Blog Generation (MUST be before generic /api/admin/:table)
  app.post("/api/admin/save-blog", adminAuth, async (req, res) => {
    const { category, blogData, image_url, packageSearchTerm, recommendedPackageId: reqPackageId } = req.body;
    if (!blogData || !category) return res.status(400).json({ error: "Blog data and Category are required" });

    try {
      // 1. Fetch the recommended package from the database
      let recommendedPackageId = reqPackageId || null;
      
      if (!recommendedPackageId && supabase && packageSearchTerm) {
        const { data: packages } = await supabase
          .from('recommended_packages')
          .select('id')
          .ilike('name', `%${packageSearchTerm}%`)
          .limit(1);
          
        if (packages && packages.length > 0) {
          recommendedPackageId = packages[0].id;
        }
      }

      // 2. Save to Database
      const { data, error } = await supabase.from('blog_posts').insert([{
        title: blogData.title,
        slug: slugify(blogData.title),
        content: blogData.content,
        meta_description: blogData.meta_description,
        category: category,
        tags: blogData.tags,
        image_url: image_url,
        recommended_package_id: recommendedPackageId
      }]).select().single();

      if (error) throw error;

      res.json(data);
    } catch (error: any) {
      console.error("Blog Save Error:", error);
      res.status(500).json({ error: error.message || "Failed to save blog article" });
    }
  });

  // Generic Admin POST
  app.post("/api/admin/:table", adminAuth, async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not configured" });
    const { table } = req.params;
    const { product_ids, ...body } = req.body;
    
    const { data, error } = await supabase.from(table).insert([body]).select().single();
    
    if (error) {
      // If is_combo is the reason for failure, try without it
      if (table === 'recommended_packages' && error.message?.includes("is_combo")) {
        console.warn("Retrying insert without is_combo...");
        const { is_combo, ...safeBody } = body;
        const { data: retryData, error: retryError } = await supabase.from(table).insert([safeBody]).select().single();
        if (retryError) return res.status(500).json({ error: retryError.message });
        
        if (Array.isArray(product_ids)) {
          const junctionData = product_ids.map(pid => ({ package_id: retryData.id, product_id: pid }));
          await supabase.from('package_products').insert(junctionData);
        }
        updateSyncTimestamp();
        return res.json(retryData);
      }
      return res.status(500).json({ error: error.message });
    }

    // Handle junction table for packages
    if (table === 'recommended_packages' && Array.isArray(product_ids)) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validProductIds = product_ids.filter(pid => pid && typeof pid === 'string' && uuidRegex.test(pid));
      
      if (validProductIds.length > 0) {
        const junctionData = validProductIds.map(pid => ({
          package_id: data.id,
          product_id: pid
        }));
        await supabase.from('package_products').insert(junctionData);
      }
    }

    updateSyncTimestamp();
    res.json(data);
  });

  // Generic Admin PUT
  app.put("/api/admin/:table/:id", adminAuth, async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not configured" });
    const { table, id } = req.params;
    const { product_ids, ...body } = req.body;
    
    // Remove fields that shouldn't be in the update body (like joined data)
    const cleanBody = { ...body };
    delete cleanBody.package_products;
    delete cleanBody.profiles;
    delete cleanBody.order_items;
    delete cleanBody.products; // Remove flattened products if present

    // Auto-generate slug for blog posts if title is present but slug is missing
    if (table === 'blog_posts' && cleanBody.title && !cleanBody.slug) {
      cleanBody.slug = slugify(cleanBody.title);
    }

    const { data, error } = await supabase.from(table).update(cleanBody).eq('id', id).select().single();
    
    if (error) {
      // If is_combo is the reason for failure, try without it
      if (table === 'recommended_packages' && error.message?.includes("is_combo")) {
        console.warn("Retrying update without is_combo...");
        const { is_combo, ...safeBody } = cleanBody;
        const { data: retryData, error: retryError } = await supabase.from(table).update(safeBody).eq('id', id).select().single();
        if (retryError) return res.status(500).json({ error: retryError.message });
        
        if (Array.isArray(product_ids)) {
          await supabase.from('package_products').delete().eq('package_id', id);
          if (product_ids.length > 0) {
            const junctionData = product_ids.map(pid => ({ package_id: id, product_id: pid }));
            await supabase.from('package_products').insert(junctionData);
          }
        }
        updateSyncTimestamp();
        return res.json(retryData);
      }
      return res.status(500).json({ error: error.message });
    }

    // Handle junction table for packages
    if (table === 'recommended_packages' && Array.isArray(product_ids)) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validProductIds = product_ids.filter(pid => pid && typeof pid === 'string' && uuidRegex.test(pid));

      // Clear existing
      await supabase.from('package_products').delete().eq('package_id', id);
      // Insert new
      if (validProductIds.length > 0) {
        const junctionData = validProductIds.map(pid => ({
          package_id: id,
          product_id: pid
        }));
        await supabase.from('package_products').insert(junctionData);
      }
    }

    updateSyncTimestamp();
    res.json(data);
  });

  // Generic Admin DELETE
  app.delete("/api/admin/:table/:id", adminAuth, async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not configured" });
    const { table, id } = req.params;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    updateSyncTimestamp();
    res.json({ success: true });
  });




  // --- Blog Routes ---
  app.get("/api/blogs", async (req, res) => {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, recommended_package:recommended_packages(*)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.get("/api/blogs/:id", async (req, res) => {
    if (!supabase) return res.status(404).json({ error: "Blog not found" });
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let query = supabase
      .from('blog_posts')
      .select('*, recommended_package:recommended_packages(*)');
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data, error } = await query.maybeSingle();
    
    if (error) return res.status(500).json({ error: error.message });
    
    // Fallback: If not found by slug, try searching by title (case-insensitive)
    if (!data && !uuidRegex.test(id)) {
      const { data: titleData, error: titleError } = await supabase
        .from('blog_posts')
        .select('*, recommended_package:recommended_packages(*)')
        .ilike('title', id.replace(/-/g, ' '))
        .maybeSingle();
      
      if (titleError) return res.status(500).json({ error: titleError.message });
      if (titleData) return res.json(titleData);
    }

    if (!data) return res.status(404).json({ error: "Blog not found" });
    
    res.json(data);
  });

  async function getMetadataForRequest(req: express.Request) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const productId = url.searchParams.get('product') || url.searchParams.get('buy_product');
    const packageId = url.searchParams.get('package') || url.searchParams.get('buy_package');
    const blogIdOrSlug = url.searchParams.get('blog');
    const activeTab = url.searchParams.get('activeTab') || url.searchParams.get('tab');

    // Default Homepage Metadata (from user request)
    let metadata = {
      title: "GHT wellness supplement | 100% herbal supplement",
      description: "the best natural supplement that works for prostate enlargement, female/male infertility, erectile dysfunction, premature ejaculation, diabetes, stroke and so on. Order Now.",
      image: "https://res.cloudinary.com/drizgfofw/image/upload/v1773906809/compressed_70kb_ox1i8j.jpg",
      url: `https://ghtwellness.vercel.app${req.url}`
    };

    if (!supabase) return metadata;

    try {
      const makeAbsolute = (url: string) => {
        if (!url) return metadata.image;
        if (url.startsWith('http')) return url;
        return `https://ghtwellness.vercel.app${url.startsWith('/') ? '' : '/'}${url}`;
      };

      if (productId) {
        const { data } = await supabase.from('products').select('name, short_desc, image_url').or(`id.eq.${productId},product_code.eq.${productId}`).maybeSingle();
        if (data) {
          metadata.title = `${data.name} | Order Now`;
          metadata.description = `${data.short_desc || metadata.description} Order Now.`;
          metadata.image = makeAbsolute(data.image_url);
        }
      } else if (packageId) {
        const { data } = await supabase.from('recommended_packages').select('name, description, package_image_url').or(`id.eq.${packageId},package_code.eq.${packageId}`).maybeSingle();
        if (data) {
          metadata.title = `${data.name} | Order Now`;
          metadata.description = `${data.description || metadata.description} Order Now.`;
          metadata.image = makeAbsolute(data.package_image_url);
        }
      } else if (blogIdOrSlug) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let query = supabase.from('blog_posts').select('title, meta_description, image_url');
        if (uuidRegex.test(blogIdOrSlug)) {
          query = query.eq('id', blogIdOrSlug);
        } else {
          query = query.eq('slug', blogIdOrSlug);
        }
        const { data } = await query.maybeSingle();
        if (data) {
          metadata.title = `${data.title} | Order Now`;
          metadata.description = `${data.meta_description || metadata.description} Order Now.`;
          metadata.image = makeAbsolute(data.image_url);
        }
      } else if (activeTab) {
        const tabTitles: Record<string, string> = {
          about: "About Us",
          consultation: "Free AI Health Consultation",
          products: "Our Health Products",
          recommended: "Expert Health Solutions",
          combo: "Combo Savings Packs",
          blog: "Health & Wellness Blog",
          history: "Your Health Records",
          testimonials: "Customer Success Stories"
        };
        if (tabTitles[activeTab]) {
          metadata.title = `${tabTitles[activeTab]} | Order Now`;
          metadata.description = `Explore our ${tabTitles[activeTab].toLowerCase()} at GHT Wellness. Premium herbal supplements and professional health consultations. Order Now.`;
        }
      }
    } catch (e) {
      console.error("Metadata generation error:", e);
    }

    return metadata;
  }

  // --- Public Routes ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const productContext = await getProductContext();
      const reply = await getAIService().generateResponse(message, productContext);

      res.json({ reply });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(503).json({ error: error.message || "AI Service Unavailable" });
    }
  });

  app.get("/api/products", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not initialized. Please ensure environment variables are set." });
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error("Products error:", error);
      return res.status(500).json({ error: error.message, hint: "Ensure the 'products' table exists in Supabase by running the SQL migration." });
    }
    res.json(data || []);
  });

  app.get("/api/recommended-packages", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not initialized. Please ensure environment variables are set." });
    try {
      const { data, error } = await supabase
        .from('recommended_packages')
        .select(`
          *,
          package_products (
            products (*)
          )
        `);
      
      if (error) {
        console.error("Packages error:", error);
        // If the error is specifically about is_combo missing, try fetching without it
        if (error.message?.includes("is_combo")) {
          console.warn("is_combo column missing in DB, falling back...");
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('recommended_packages')
            .select(`
              id, name, description, price, discount, package_image_url, health_benefits, symptoms, package_code, created_at, updated_at,
              package_products (
                products (*)
              )
            `);
          if (fallbackError) return res.status(500).json({ error: fallbackError.message, hint: "Ensure the 'recommended_packages' and 'package_products' tables exist." });
          
          const formatted = fallbackData?.map((pkg: any) => ({
            ...pkg,
            is_combo: false, // Default if column missing
            products: pkg.package_products?.map((pp: any) => pp.products).filter(Boolean) || []
          })) || [];
          return res.json(formatted);
        }
        return res.status(500).json({ error: error.message, hint: "Ensure the 'recommended_packages' and 'package_products' tables exist in Supabase by running the SQL migration." });
      }
      
      // Format the data to flatten the products array for easier frontend consumption
      const formatted = data?.map((pkg: any) => ({
        ...pkg,
        is_combo: pkg.is_combo || false,
        products: pkg.package_products?.map((pp: any) => pp.products).filter(Boolean) || []
      })) || [];
      
      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/consultations", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not configured" });
    const { patient_name, phone, illness, symptoms, distributor_id } = req.body;
    const access_token = getAccessToken(req);
    
    if (!access_token) return res.status(401).json({ error: "No session token found" });

    // 1. Handle Profile (Create or Find)
    let profile_id: string | null = null;
    try {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phone)
        .maybeSingle();
      
      if (pError) throw pError;

      if (profile) {
        profile_id = profile.id;
      } else {
        const { data: newProfile, error: nError } = await supabase
          .from('profiles')
          .insert([{ full_name: patient_name, phone_number: phone, access_token }])
          .select('id')
          .single();
        if (nError) throw nError;
        profile_id = newProfile.id;
      }
    } catch (e) {
      console.error("Profile Error:", e);
    }

    // 2. Fetch Product Context
    const productContext = await getProductContext();

    // 3. Generate AI Recommendation using centralized service
    let ai_recommendation = "Our team will review your symptoms and get back to you.";
    let recommended_products: string[] = [];

    try {
      const prompt = `
        Patient Name: ${patient_name}
        Symptoms: ${symptoms}
        Reported Illness: ${illness}

        Based on the available GHT products, provide a professional recommendation.
        Format your response as a JSON object:
        {
          "recommendation": "Detailed markdown recommendation...",
          "products": ["Product Name 1", "Product Name 2"]
        }
      `;

      const response = await getAIService().generateResponse(prompt, productContext, undefined, "application/json");
      try {
        const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(jsonStr);
        ai_recommendation = result.recommendation || response;
        recommended_products = result.products || [];
      } catch (e) {
        // Fallback if AI didn't return valid JSON
        ai_recommendation = response;
      }
    } catch (e) {
      console.error("Consultation AI Error:", e);
    }

    const { data, error } = await supabase
      .from('consultations')
      .insert([
        { 
          profile_id,
          patient_name, 
          phone, 
          illness, 
          symptoms, 
          ai_recommendation, 
          recommended_products, 
          access_token, 
          distributor_id 
        }
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, ai_recommendation });
  });

  app.get("/api/my-consultations", async (req, res) => {
    if (!supabase) return res.json([]);
    const access_token = getAccessToken(req);
    if (!access_token) return res.json([]);

    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('access_token', access_token);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/my-orders", async (req, res) => {
    if (!supabase) return res.json([]);
    const access_token = getAccessToken(req);
    if (!access_token) return res.json([]);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('access_token', access_token);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/upload-receipt", async (req, res) => {
    const { fileData, fileName, mimeType } = req.body;
    if (!fileData || !fileName) return res.status(400).json({ error: "Missing file data" });

    try {
      // 1. Try Cloudinary first if configured
      const cloudinary = getCloudinaryService();
      if (process.env.CLOUDINARY_ACCOUNTS || process.env.CLOUDINARY_URL) {
        console.log("Using Cloudinary for receipt upload...");
        const result = await cloudinary.uploadImage(fileData, 'receipts');
        if (result) {
          return res.json({ publicUrl: result.url });
        }
      }

      // 2. Fallback to Supabase Storage
      if (!supabase) return res.status(503).json({ error: "Cloudinary failed and Supabase not configured" });
      
      console.log("Falling back to Supabase Storage for receipt upload...");
      // Decode base64
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(`receipts/${fileName}`, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(`receipts/${fileName}`);

      res.json({ publicUrl });
    } catch (error: any) {
      console.error("Upload Error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // New Cloudinary Specific Upload Route (for Admin/Products)
  app.post("/api/cloudinary-upload", adminAuth, async (req, res) => {
    const { fileData, folder } = req.body;
    if (!fileData) return res.status(400).json({ error: "Missing file data" });

    try {
      const result = await getCloudinaryService().uploadImage(fileData, folder || 'products');
      if (!result) throw new Error("Cloudinary upload failed");
      res.json(result);
    } catch (error: any) {
      console.error("Cloudinary Upload Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // New Cloudinary Specific Delete Route
  app.delete("/api/cloudinary-delete", adminAuth, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const success = await getCloudinaryService().deleteImage(url);
      res.json({ success });
    } catch (error: any) {
      console.error("Cloudinary Delete Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not configured" });
    const access_token = getAccessToken(req);
    if (!access_token) return res.status(401).json({ error: "No session token found" });

    const { 
      full_name, 
      phone_number, 
      delivery_address, 
      landmark, 
      delivery_date, 
      payment_method, 
      payment_receipt_url,
      sender_name,
      items,
      total_amount,
      distributor_id
    } = req.body;

    // 1. Handle Profile (Create or Find)
    let profile_id: string | null = null;
    try {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phone_number)
        .maybeSingle();
      
      if (pError) throw pError;

      if (profile) {
        profile_id = profile.id;
      } else {
        const { data: newProfile, error: nError } = await supabase
          .from('profiles')
          .insert([{ full_name, phone_number, access_token }])
          .select('id')
          .single();
        if (nError) throw nError;
        profile_id = newProfile.id;
      }
    } catch (e) {
      console.error("Profile Error:", e);
      return res.status(500).json({ error: "Failed to create/find profile" });
    }

    // 2. Create Order
    const { data: order, error: oError } = await supabase
      .from('orders')
      .insert([
        { 
          profile_id,
          total_amount,
          status: 'pending',
          shipping_address: `${delivery_address}${landmark ? ` (Landmark: ${landmark})` : ''}`,
          delivery_date,
          payment_method,
          payment_receipt_url,
          sender_name,
          access_token,
          distributor_id
        }
      ])
      .select()
      .single();

    if (oError) return res.status(500).json({ error: oError.message });

    // 3. Create Order Items
    if (items && Array.isArray(items)) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity || 1,
        price_at_time: item.price_at_time || (item.price_naira * (1 - (item.discount_percent || 0) / 100))
      }));

      const { error: oiError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (oiError) console.error("Order Items Error:", oiError);
    }

    // 4. Send Notifications (Wait for completion on Vercel)
    try {
      await NotificationService.sendOrderNotification(
        { ...order, full_name, phone_number, delivery_address, landmark, payment_method, payment_receipt_url }, 
        items || []
      );
      console.log("✅ Notifications sent successfully.");
    } catch (err) {
      console.error("❌ Notification Error:", err);
    }

    res.json(order);
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      path: req.path
    });
  });

  // Dynamic Social Sharing Logic
  app.get("*", async (req, res, next) => {
    // Skip API, static files, and other non-HTML requests
    const isStaticFile = req.path.includes(".");
    if (req.path.startsWith("/api/") || isStaticFile) return next();

    try {
      const userAgent = req.headers['user-agent'] || '';
      const isBot = /bot|googlebot|facebookexternalhit|twitterbot|slackbot|linkedinbot|whatsapp|telegram|pinterest|discord|messenger/i.test(userAgent);
      const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
      
      // If NOT a bot and NOT production, continue to Vite in dev
      if (!isBot && !isProduction) return next();

      const metadata = await getMetadataForRequest(req);
      
      // Fallback paths for index.html depending on environment
      const possibleIndexPaths = [
        path.resolve(process.cwd(), "dist/index.html"),
        path.resolve(process.cwd(), "index.html"),
        // Vercel output structure fallback
        path.join(__dirname, "../dist/index.html"),
        path.join(__dirname, "dist/index.html"),
        path.join(__dirname, "../index.html")
      ];

      let indexPath = possibleIndexPaths[0];
      for (const p of possibleIndexPaths) {
        if (fs.existsSync(p)) {
          indexPath = p;
          break;
        }
      }
      
      if (!fs.existsSync(indexPath)) {
        console.warn(`[Social Meta] index.html not found after trying: ${possibleIndexPaths.join(', ')}`);
        return next();
      }

      let html = fs.readFileSync(indexPath, "utf-8");

      // Escape quotes for metadata
      const cleanTitle = (metadata.title || CONFIG.company.name).replace(/"/g, '&quot;');
      const cleanDesc = (metadata.description || "").replace(/"/g, '&quot;');

      // Dynamic meta tags using OG and Twitter Card standards
      const metaTags = `
    <!-- Social Preview Tags (Dynamic) -->
    <meta name="description" content="${cleanDesc}" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDesc}" />
    <meta property="og:image" content="${metadata.image}" />
    <meta property="og:image:secure_url" content="${metadata.image}" />
    <meta property="og:url" content="${metadata.url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="GHT Wellness" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${cleanTitle}" />
    <meta name="twitter:description" content="${cleanDesc}" />
    <meta name="twitter:image" content="${metadata.image}" />
    <meta name="twitter:label1" content="CTA" />
    <meta name="twitter:data1" content="Order Now" />
    <meta property="whatsapp:title" content="${cleanTitle}" />
    <meta property="whatsapp:description" content="${cleanDesc}" />
      `;

      // Update Title tag
      if (html.includes("<title>")) {
        html = html.replace(/<title>.*?<\/title>/, `<title>${cleanTitle}</title>`);
      } else {
        html = html.replace("</head>", `<title>${cleanTitle}</title></head>`);
      }
      
      // Inject meta tags before closing head
      html = html.replace("</head>", `${metaTags}</head>`);
      
      console.log(`[Social Meta] Serving metadata for ${req.url} to ${userAgent.substring(0, 50)}...`);

      res.set("Content-Type", "text/html");
      return res.send(html);
    } catch (e) {
      console.error("Social Meta Middleware Error:", e);
      next();
    }
  });

  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    // Serve static files from 'dist' folder
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Fallback for SPA routing
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// Start the server only if run directly (not imported as a module)
const PORT = 3000;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
  });
}
