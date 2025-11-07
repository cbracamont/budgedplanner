import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul>
              <li>Account information (email, name)</li>
              <li>Financial data you enter (income, expenses, debts, savings goals)</li>
              <li>Profile preferences and settings</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information.
            </p>
            <ul>
              <li>All data is encrypted in transit and at rest</li>
              <li>We use secure authentication methods</li>
              <li>Access to personal data is restricted to authorized personnel only</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
            </ul>

            <h2>5. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt-out of communications</li>
            </ul>

            <h2>6. Cookies and Tracking</h2>
            <p>
              We use essential cookies and local storage to maintain your session and preferences. We do not use third-party tracking cookies for advertising purposes.
            </p>

            <h2>7. Third-Party Services</h2>
            <p>
              We use third-party services for authentication (Google OAuth) and data storage. These services have their own privacy policies governing the use of your information.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.
            </p>

            <h2>9. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the application.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
