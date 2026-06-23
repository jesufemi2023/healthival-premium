import React from "react";
import { motion } from "motion/react";
import { 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  Home as HomeIcon,
  ShoppingBag, 
  PhoneCall, 
  Truck, 
  Clock, 
  ShieldCheck, 
  HeartHandshake,
  Globe,
  Tag
} from "lucide-react";
import { CONFIG } from "../config";

interface ThankYouPageProps {
  onNavigate: (tab: "home" | "products" | "recommended" | "combo") => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ onNavigate }) => {
  // Parse order details from URL if redirected from a completed checkout
  const params = new URLSearchParams(window.location.search);
  const fullName = params.get("full_name") || "";
  const itemName = params.get("item_name") || "";
  const quantity = params.get("quantity") || "";
  const totalPrice = params.get("total_price") || "";
  const deliveryDate = params.get("delivery_date") || "";
  const paymentMethod = params.get("payment_method") || "";

  const isDirectAccess = !fullName && !itemName;

  const handleWhatsAppConfirm = () => {
    const textMessage = `Hello SD GHT Health Care, I just completed my purchase on your website!
${fullName ? `Name: ${fullName}` : ""}
${itemName ? `Item: ${quantity ? `${quantity}x ` : ""}${itemName}` : ""}
${totalPrice ? `Total Price: ₦${parseInt(totalPrice).toLocaleString()}` : ""}
${deliveryDate ? `Expected Delivery: ${deliveryDate}` : ""}
${paymentMethod ? `Payment Method: ${paymentMethod === "pod" ? "Pay on Delivery (POD)" : "Bank Transfer"}` : ""}
Please confirm my order and expedite fast delivery! Thank you.`;

    window.open(
      `https://wa.me/${CONFIG.company.phone.replace(/\D/g, "")}?text=${encodeURIComponent(textMessage)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Google Ads & Meta Pixel Tracking Indicator */}
        <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-center text-xs text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider">Conversion Tracked Successfully</span>
          </div>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          {/* Accent decoration */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
          
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 size={48} className="text-emerald-600 animate-bounce" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
            {isDirectAccess ? "Thank You for Choosing Us!" : "Success! Order Placed."}
          </h1>
          
          <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
            {isDirectAccess 
              ? "Your trust makes our mission possible. We are committed to supplying you with premium, clinically tested scientific herbal products that promote vibrant, holistic longevity."
              : `Thank you for your trust, ${fullName}. We have securely received your order request and have reserved your stock helper. Here are your transaction details.`}
          </p>

          {/* Dynamic Interactive Receipt (Only show if checkout params are loaded) */}
          {!isDirectAccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-left max-w-xl mx-auto space-y-4 mb-8 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Customer Name</span>
                <span className="text-slate-900 font-extrabold text-sm">{fullName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Product Order</span>
                <span className="text-slate-900 font-extrabold text-sm text-right max-w-[70%] truncate">
                  {quantity ? `${quantity}x ` : ""}{itemName}
                </span>
              </div>
              {totalPrice && (
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Total Amount</span>
                  <span className="text-emerald-600 font-black text-base">₦{parseInt(totalPrice).toLocaleString()}</span>
                </div>
              )}
              {deliveryDate && (
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Delivery Schedule</span>
                  <span className="text-slate-900 font-semibold text-sm flex items-center gap-1.5">
                    <Clock size={14} className="text-teal-600 animate-pulse" />
                    {deliveryDate}
                  </span>
                </div>
              )}
              {paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Payment Method</span>
                  <span className="bg-slate-200/50 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md border border-slate-250">
                    {paymentMethod === "pod" ? "💵 Pay on Delivery" : "🏦 Bank Transfer"}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            <button
              onClick={handleWhatsAppConfirm}
              className="w-full sm:flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[16px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 transition-all transform active:scale-95 cursor-pointer"
            >
              <MessageSquare size={20} />
              Confirm on WhatsApp
            </button>
            
            <button
              onClick={() => onNavigate("products")}
              className="w-full sm:flex-1 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-[16px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer"
            >
              <ShoppingBag size={20} />
              Go Back to Shop
            </button>
          </div>
        </motion.div>

        {/* Value Proposition & Ship Timelines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">Fast Delivery</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Orders are dispatched under priority and delivered right to your doorstep within 24 to 48 hours.</p>
            </div>
          </div>
          
          <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm flex items-start gap-4">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">Authentic GHT</h3>
              <p className="text-slate-500 text-sm leading-relaxed">All ordered products are sourced straight from official FDA & NAFDAC certified reserves.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <PhoneCall size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">24/7 Support</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Need help or dosage direction? Chat with our experts directly for supportive follow-up guides.</p>
            </div>
          </div>
        </div>

        {/* Interactive FAQs Section */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <HeartHandshake className="text-emerald-600" size={26} />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Post-Purchase FAQs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 text-base">How long before my order arrives?</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Generally, delivery takes 24 hours inside major hubs (Lagos, Abuja, Port Harcourt) and up to 48 hours for other state destinations.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 text-base">Do I need to confirm over WhatsApp?</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Sending a WhatsApp dispatch receipt acts as an immediate trigger to bypass queue lines, guaranteeing faster priority confirmation.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 text-base">Is Pay on Delivery (POD) available?</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Yes, POD is fully supported. Simply inspect your package items when delivered and transfer or pay cash directly to the dispatch rider.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 text-base">Can I change my order details?</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Absolutely. Click the "Confirm on WhatsApp" button or call our medical follow-up lines to speak directly with an agent to adjust instructions.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion Section */}
        <div className="text-center space-y-4 pt-6">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Want to check different health treatments?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate("recommended")}
              className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Globe size={14} className="text-emerald-600" />
              Expert Solutions
            </button>
            <button
              onClick={() => onNavigate("combo")}
              className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Tag size={14} className="text-teal-600" />
              Combo Packs
            </button>
            <button
              onClick={() => onNavigate("home")}
              className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HomeIcon size={14} className="text-slate-500" />
              Back to Home
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
