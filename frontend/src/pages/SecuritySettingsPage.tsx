import { useAuth } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Shield, Key, Mail, Trash2 } from 'lucide-react'

export function SecuritySettingsPage() {
  const { state } = useAuth()

  return (
    <div className="container max-w-4xl py-12 mx-auto px-4">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter">Security Settings</h1>
        <p className="text-zinc-500 mt-2">Manage your account security and authentication preferences.</p>
      </div>

      <div className="grid gap-8">
        <Card className="border-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" />
              </div>
            </div>
            <Button className="font-bold">Update Password</Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Address
            </CardTitle>
            <CardDescription>Change the email associated with your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input value={state.user?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>New Email</Label>
                <Input type="email" />
              </div>
            </div>
            <Button variant="outline" className="font-bold">Request Email Change</Button>
          </CardContent>
        </Card>

        <Card className="border-red-100 border bg-red-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Permanently delete your account and all associated data.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 mb-4">
              This action is irreversible. All your research data, profile info, and contributions will be permanently removed.
            </p>
            <Button variant="destructive" className="font-bold">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
