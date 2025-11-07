import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Use</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this family budget management application, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use this application for personal, non-commercial use only. This is the grant of a license, not a transfer of title.
            </p>

            <h2>3. User Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2>4. Financial Data</h2>
            <p>
              This application allows you to track your personal finances. You acknowledge that:
            </p>
            <ul>
              <li>All financial data entered is your responsibility</li>
              <li>The application provides tools for tracking but does not provide financial advice</li>
              <li>You should consult with a qualified financial advisor for professional advice</li>
            </ul>

            <h2>5. Privacy and Data Protection</h2>
            <p>
              Your use of the application is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
            </p>

            <h2>6. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the application after changes constitutes acceptance of the modified terms.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              The application is provided "as is" without warranties of any kind. We shall not be liable for any damages arising from the use of this application.
            </p>

            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the application immediately, without prior notice, for any breach of these Terms.
            </p>

            <h2>9. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us through the application.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
