import React from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, 
  RefreshCw, 
  Clock, 
  HelpCircle,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FileText
} from "lucide-react";
import { CONFIG } from "../config";

interface ReturnPolicyProps {
  onNavigate: (tab: "home" | "products" | "recommended" | "combo") => void;
}

export const ReturnPolicy: React.FC<ReturnPolicyProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Breadcrumb / Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wider">
            <CheckCircle2 size={12} />
            Merchant Verified Policy
          </div>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-extrabold uppercase tracking-widest text-xs">
                <FileText size={14} />
                Returns & Exchanges
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                Return & Exchange Policy
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Last Updated: June 2026 • SD GHT Health Care
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
              <RefreshCw size={36} className="animate-spin-slow" />
            </div>
          </div>

          {/* Quick Policy Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative">
              <div className="flex items-center gap-3 mb-3 text-amber-600">
                <ShieldAlert size={20} />
                <h3 className="font-extrabold text-slate-900">Defective Products Only</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                We accept returns <span className="text-slate-900 font-bold">strictly for defective or damaged products</span>. Please inspect your order immediately on delivery. Returns must be requested within <span className="text-slate-900 font-bold">24 hours</span>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative">
              <div className="flex items-center gap-3 mb-3 text-emerald-600">
                <RefreshCw size={20} />
                <h3 className="font-extrabold text-slate-900">Exchanges & Replacements</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                We do not issue cash or bank refunds. Instead, we provide a <span className="text-slate-900 font-bold">new replacement unit</span> of the same product or allow you to <span className="text-emerald-600 font-bold">exchange it for any other product</span> of equivalent value.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Detailed Guidelines */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-10 shadow-sm space-y-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Policy Terms & Conditions</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Clock size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">1. 24-Hour Return Window</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Due to the nature of organic scientific health compounds, any defective item return claim must be lodged with our support team within exactly 24 hours of confirmed dispatch or delivery receipt. Claims submitted after this window are not eligible for replacement.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">2. Defect Eligibility & Immediate Examination</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Defective state covers <span className="text-slate-900 font-bold">spoilt or melted capsules</span>, damaged seals during transit, broken bottles, leakage, or major product degradation. 
                  <br />
                  <span className="text-amber-700 font-bold">Important:</span> A customer should immediately examine their product upon delivery by the rider dispatcher for leakage and broken bottles. The product can be returned to the dispatcher immediately; otherwise, we will not accept returns for these defects once the checkout is complete and the dispatcher has departed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">3. Compensation Options & Product Exchanges</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We are standardizing replacements in compliance with Merchant Guidelines:
                  <br />
                  • <span className="font-bold text-slate-900">Identical Replacement:</span> We will ship out a fresh item to replace the verified defective one.
                  <br />
                  • <span className="font-bold text-slate-900">Product Exchange:</span> A product can be swapped or exchanged with any other product from our store. If the chosen product is priced higher, you simply pay the difference.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <RefreshCw size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">4. Return Delivery Charges</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  The returned products will be charged for delivery <span className="text-slate-900 font-bold">if and only if the products were freely delivered in the first place</span>. If you originally paid a delivery fee for your package, no additional delivery fee will be charged for dispatching your replacement or exchange item.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <HelpCircle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">5. No Monetary Refunds</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  All transactions and sales are final. Please consider your clinical guidance, consultation summaries, or order parameters carefully before paying. SD GHT Health Care guarantees product replacement or package exchange support instead of monetary refunds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to initiate return/exchange */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-10 shadow-sm text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-xl font-bold text-slate-900">Need to initiate a Return or Exchange?</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Contact our instant customer response division immediately. Be prepared to provide clear photos or a short video demonstrating any package damage or seal defects.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <a
              href={`https://wa.me/${CONFIG.company.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hello SD GHT Health Care, I would like to enquire about a return or product exchange based on your Return Policy.")}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Phone size={14} />
              WhatsApp Support
            </a>
            
            <a
              href="mailto:support@ghtwellness.com"
              className="w-full sm:flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
            >
              <Mail size={14} />
              Email Desk
            </a>
          </div>
        </div>

        {/* Quick Back CTA */}
        <div className="text-center">
          <button
            onClick={() => onNavigate("products")}
            className="px-8 py-3.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm transition-all"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};
