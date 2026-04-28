import { useAuth } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Library, Globe, Share2, Mail, Shield, Bell } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '@/api/client'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function AccountSettingsPage() {
  const { state, dispatch } = useAuth()
  const location = useLocation()
  
  // Detection logic for active tab
  let activeTab = 'profile'
  if (location.pathname.includes('security')) activeTab = 'security'
  else if (location.pathname.includes('emails')) activeTab = 'emails'
  else if (location.pathname.includes('notifications')) activeTab = 'notifications'

  const [notificationsEnabled, setNotificationsEnabled] = useState(state.user?.notifications_enabled ?? true)
  const [notificationsPriority, setNotificationsPriority] = useState(state.user?.notifications_priority ?? 'medium')
  const [isUpdating, setIsUpdating] = useState(false)

  // Profile state
  const [fullName, setFullName] = useState(state.user?.full_name ?? '')
  const [displayName, setDisplayName] = useState(state.user?.profile?.display_name ?? '')
  const [bio, setBio] = useState(state.user?.profile?.bio ?? '')
  const [institution, setInstitution] = useState(state.user?.profile?.institution ?? '')
  const [googleScholar, setGoogleScholar] = useState(state.user?.profile?.social_links?.scholar ?? '')
  const [researchInterests, setResearchInterests] = useState<string[]>(state.user?.profile?.research_interests ?? [])
  const [newInterest, setNewInterest] = useState('')

  useEffect(() => {
    if (state.user) {
      setNotificationsEnabled(state.user.notifications_enabled)
      setNotificationsPriority(state.user.notifications_priority)
      setFullName(state.user.full_name)
      if (state.user.profile) {
        setDisplayName(state.user.profile.display_name ?? '')
        setBio(state.user.profile.bio ?? '')
        setInstitution(state.user.profile.institution ?? '')
        setGoogleScholar(state.user.profile.social_links?.scholar ?? '')
        setResearchInterests(state.user.profile.research_interests ?? [])
      }
    }
  }, [state.user])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} />, path: '/settings/profile' },
    { id: 'emails', label: 'Emails', icon: <Mail size={18} />, path: '/settings/emails' },
    { id: 'security', label: 'Security', icon: <Shield size={18} />, path: '/settings/security' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, path: '/settings/notifications' },
  ]

  const handleUpdateSettings = async () => {
    setIsUpdating(true)
    try {
      await api.put('/api/v1/users/settings', {
        notifications_enabled: notificationsEnabled,
        notifications_priority: notificationsPriority,
      })
      
      alert("Settings updated: Your notification preferences have been saved.")
      
      if (state.user) {
        dispatch({
          type: 'SET_AUTH',
          payload: {
            accessToken: state.accessToken!,
            user: {
              ...state.user,
              notifications_enabled: notificationsEnabled,
              notifications_priority: notificationsPriority as any,
            }
          }
        })
      }
    } catch (err) {
      alert("Update failed: Could not save settings. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      await api.put('/api/v1/users/profile', {
        full_name: fullName,
        display_name: displayName,
        bio: bio,
        institution: institution,
        research_interests: researchInterests,
        google_scholar: googleScholar,
      })
      
      alert("Profile updated successfully!")
      
      // Update global auth state
      if (state.user) {
        dispatch({
          type: 'SET_AUTH',
          payload: {
            accessToken: state.accessToken!,
            user: {
              ...state.user,
              full_name: fullName,
              profile: {
                ...state.user.profile,
                display_name: displayName,
                bio: bio,
                institution: institution,
                research_interests: researchInterests,
                social_links: {
                  ...state.user.profile?.social_links,
                  scholar: googleScholar,
                }
              }
            }
          }
        })
      }
    } catch (err) {
      alert("Update failed: Could not save profile. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const addInterest = () => {
    if (newInterest.trim() && !researchInterests.includes(newInterest.trim())) {
      setResearchInterests([...researchInterests, newInterest.trim()])
      setNewInterest('')
    }
  }

  const removeInterest = (tag: string) => {
    setResearchInterests(researchInterests.filter(t => t !== tag))
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tighter">SETTINGS</h1>
          <p className="text-zinc-500 font-medium mt-2">Manage your academic profile and application preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-12">
          {/* Settings Sidebar */}
          <aside className="space-y-2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-lg shadow-black/5' 
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-black'
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            ))}
          </aside>

          {/* Settings Content */}
          <div className="space-y-8">
            {activeTab === 'profile' && (
              <>
                <Card className="rounded-[2.5rem] border-zinc-100 shadow-none bg-white">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-2xl font-black tracking-tight">Public Profile</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">This information will be visible to other researchers.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-3xl font-black text-black">
                          {state.user?.full_name?.charAt(0)}
                        </div>
                        <button className="absolute -bottom-2 -right-2 bg-black text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                          <Share2 size={16} />
                        </button>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Full Name</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-2xl border-zinc-100 bg-zinc-50 px-4 py-6" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Display Name</Label>
                            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Dr. Jane Doe" className="rounded-2xl border-zinc-100 bg-zinc-50 px-4 py-6" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Bio</Label>
                          <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your research focus..." className="rounded-2xl border-zinc-100 bg-zinc-50 px-4 py-6" />
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-zinc-50" />
                    
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Primary Institution</Label>
                        <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. Stanford University" className="rounded-2xl border-zinc-100 bg-zinc-50 px-4 py-6" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Academic Website (Google Scholar)</Label>
                        <div className="relative">
                          <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <Input value={googleScholar} onChange={(e) => setGoogleScholar(e.target.value)} placeholder="https://scholar.google.com/..." className="pl-12 rounded-2xl border-zinc-100 bg-zinc-50 px-4 py-6" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleUpdateProfile} disabled={isUpdating} className="rounded-2xl px-8 py-6 font-bold shadow-xl shadow-black/5">
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-zinc-100 shadow-none bg-white">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                      <Library size={24} />
                      Research Interests
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">Add tags to help others find your work.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="flex flex-wrap gap-2 mb-6">
                      {researchInterests.map(tag => (
                        <div key={tag} className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-sm font-bold flex items-center gap-2 group hover:border-red-200 transition-colors cursor-pointer" onClick={() => removeInterest(tag)}>
                          {tag}
                          <span className="text-zinc-300 group-hover:text-red-500">×</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        value={newInterest} 
                        onChange={(e) => setNewInterest(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                        placeholder="Add new research interest..." 
                        className="rounded-2xl border-zinc-100 bg-zinc-50 px-4 py-6" 
                      />
                      <Button variant="outline" onClick={addInterest} className="rounded-2xl px-8 py-6 font-bold">
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-zinc-100 shadow-none bg-white">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-2xl font-black tracking-tight">Account Information</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">Manage your login credentials and role.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Email Address</Label>
                      <Input value={state.user?.email} disabled className="rounded-2xl border-zinc-100 bg-zinc-50/50 px-4 py-6 cursor-not-allowed" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-1">Email cannot be changed during beta.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Account Role</Label>
                      <div className="px-4 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 font-bold text-sm capitalize">
                        {state.user?.role}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'emails' && (
              <div className="space-y-8">
                <Card className="rounded-[2.5rem] border-zinc-100 shadow-none bg-white">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-2xl font-black tracking-tight">Email Addresses</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">Manage how you receive communications.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Primary Email</Label>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-zinc-100">
                          <Mail size={18} className="text-black" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-black">{state.user?.email}</div>
                          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Verified Primary</div>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Email changes are restricted during early access.</p>
                    </div>

                    <Separator className="bg-zinc-50" />

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Zosterix System Email</Label>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-emerald-100 border-dashed">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-zinc-100">
                          <Globe size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-black">Zosterix.Phaenicio@gmail.com</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Updates & Support Sender</div>
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-zinc-500 leading-relaxed max-w-sm px-1">
                        This is the official email address used for research updates, system notifications, and support tickets.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <Card className="rounded-[2.5rem] border-zinc-100 shadow-none bg-white">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-2xl font-black tracking-tight">Notification Preferences</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">Control how and when you want to be alerted.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-black text-black">Enable Platform Notifications</Label>
                        <p className="text-xs text-zinc-500 font-medium max-w-xs">Receive updates about your research, supervisor messages, and platform news.</p>
                      </div>
                      <Checkbox 
                        checked={notificationsEnabled} 
                        onCheckedChange={(checked) => setNotificationsEnabled(checked === true)}
                        className="w-6 h-6 rounded-lg border-2 border-zinc-200 data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                    </div>

                    <Separator className="bg-zinc-50" />

                    <div className="space-y-6">
                      <div className="space-y-1">
                        <Label className="text-sm font-black text-black">Notification Priority</Label>
                        <p className="text-xs text-zinc-500 font-medium">Choose which level of alerts should trigger immediate notifications.</p>
                      </div>
                      
                      <RadioGroup 
                        value={notificationsPriority} 
                        onValueChange={(val) => setNotificationsPriority(val as any)}
                        className="grid grid-cols-2 gap-4"
                      >
                        {[
                          { id: 'low', label: 'Low', desc: 'Summary updates' },
                          { id: 'medium', label: 'Medium', desc: 'Standard alerts' },
                          { id: 'high', label: 'High', desc: 'Direct actions' },
                          { id: 'critical', label: 'Critical', desc: 'System only' },
                        ].map((p) => (
                          <div key={p.id} className="relative">
                            <RadioGroupItem
                              value={p.id}
                              id={p.id}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={p.id}
                              className="flex flex-col p-4 rounded-2xl bg-zinc-50 border-2 border-transparent hover:bg-zinc-100 cursor-pointer peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-white transition-all"
                            >
                              <span className="font-black text-sm uppercase tracking-widest">{p.label}</span>
                              <span className="text-[10px] text-zinc-500 font-bold uppercase">{p.desc}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleUpdateSettings} 
                        disabled={isUpdating}
                        className="rounded-2xl px-8 py-6 font-bold shadow-xl shadow-black/5"
                      >
                        {isUpdating ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <Card className="rounded-[2.5rem] border-zinc-100 shadow-none bg-white p-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center mx-auto mb-6 text-zinc-300">
                  <Shield size={32} />
                </div>
                <h3 className="text-2xl font-black tracking-tight uppercase">SECURITY SETTINGS</h3>
                <p className="text-zinc-500 font-medium mt-2 max-w-xs mx-auto">Please use the dedicated security page to manage your password and account protection.</p>
                <Link to="/settings/security">
                  <Button className="mt-8 rounded-2xl font-bold py-6 px-8 shadow-xl shadow-black/5">Open Security Settings</Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
