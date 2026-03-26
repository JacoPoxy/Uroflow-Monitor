import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Layout } from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-400">
          <AlertCircle className="w-16 h-16" />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-lg text-slate-500 mb-8 max-w-md">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg">Return to Dashboard</Button>
        </Link>
      </div>
    </Layout>
  );
}
