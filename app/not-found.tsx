import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#FAFAFC]">
      <div className="text-center space-y-5">
        <FileText className="w-14 h-14 mx-auto text-[#9CA3AF]/20" />
        <h1 className="text-2xl font-bold text-[#171717]">Page Not Found</h1>
        <p className="text-sm text-[#9CA3AF]">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button variant="outline" className="mt-3 border-[#ECECF3] hover:border-[#6D4AFF]/30">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
