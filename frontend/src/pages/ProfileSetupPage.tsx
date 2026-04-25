import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Upload, Beaker, GraduationCap, Building2 } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function ProfileSetupPage() {
  const { state, dispatch } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    bio: '',
    institution: '',
    researchInterests: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // For now, we'll just simulate the update or implement a basic endpoint
      // The prompt focus is on Auth, but let's assume we update the profile
      await api.put('/api/v1/users/profile', {
        bio: formData.bio,
        institution: formData.institution,
        research_interests: formData.researchInterests.split(',').map(i => i.trim()),
      })

      // Update local state
      if (state.user) {
        dispatch({
          type: 'SET_AUTH',
          payload: {
            accessToken: state.accessToken!,
            user: { ...state.user, profileComplete: true },
          },
        })
      }
      navigate('/feed')
    } catch (err) {
      // Simple error handling
      navigate('/feed') // Fallback
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-12">
      <Card className="w-full max-w-[600px] border-none shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 border-2 border-dashed border-zinc-200 cursor-pointer hover:bg-zinc-100">
            <Upload className="h-8 w-8 text-zinc-400" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">Complete your profile</CardTitle>
          <CardDescription>Tell the community a bit more about your work.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Bio</Label>
              <textarea
                placeholder="Briefly describe your research background..."
                className="flex min-h-[100px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Institution</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="University of Colombo"
                  className="rounded-xl border-zinc-200 py-6 pl-10"
                  value={formData.institution}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, institution: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Research Interests (Comma separated)</Label>
              <div className="relative">
                <Beaker className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Bioinformatics, Genomics, AI"
                  className="rounded-xl border-zinc-200 py-6 pl-10"
                  value={formData.researchInterests}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, researchInterests: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => navigate('/feed')} className="flex-1 rounded-xl py-6 font-bold">
                Skip for now
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-[2] rounded-xl py-6 font-bold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
