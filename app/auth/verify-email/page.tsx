import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-900">
      <div className="w-full max-w-md">
        <Card className="border-cyan-800/50 bg-blue-950/80 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-cyan-600/20 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-50">Check Your Email</CardTitle>
            <CardDescription className="text-blue-200">
              We&apos;ve sent you a confirmation link to verify your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-blue-200 space-y-2">
              <p>Please check your inbox and click the confirmation link to activate your account.</p>
              <p>Once confirmed, you&apos;ll be able to sign in and start using KINK IT.</p>
            </div>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30"
            >
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
