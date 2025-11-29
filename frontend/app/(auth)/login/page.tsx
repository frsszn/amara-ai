import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md overflow-hidden">
              <Image
                src="/logo.png"
                alt="Amara AI"
                width={24}
                height={24}
                className="size-6 object-contain"
              />
            </div>
            Amara AI
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
          <div className="text-center p-8">
            <div className="mb-8">
              <Image
                src="/logo.png"
                alt="Amara AI"
                width={120}
                height={120}
                className="mx-auto opacity-80"
              />
            </div>
            <h2 className="text-3xl font-bold text-foreground/80 mb-4">
              Credit Risk Assessment
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Harness the power of AI to make smarter lending decisions. Analyze
              borrower risk with ML, vision, and NLP modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
