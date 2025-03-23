import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface BoardMember {
  id: string;
  email: string;
  role?: string;
}

type BoardMembersProps = {
  boardId: string;
  ownerId: string;
}

export default function BoardMembers({ boardId, ownerId }: BoardMembersProps) {
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetchBoardMembers()
    checkIfOwner()
  }, [boardId])
  
  // Add event listener for escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isModalOpen]);

  const checkIfOwner = async () => {
    const { data } = await supabase.auth.getSession()
    setIsOwner(data.session?.user.id === ownerId)
  }

  const fetchBoardMembers = async () => {
    try {
      setLoading(true)
      
      // Fetch the board owner first
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('user_id')
        .eq('id', boardId)
        .single()
      
      if (boardError) throw boardError
      
      // Get the owner's profile
      const { data: ownerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', boardData.user_id)
        .single()
        
      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means not found, which is fine - we'll use a default value
        console.warn('Owner profile not found:', profileError)
      }
      
      // Then fetch other members
      const { data: membersData, error: membersError } = await supabase
        .from('board_members')
        .select('id, user_id, role')
        .eq('board_id', boardId)
      
      if (membersError) throw membersError
      
      // Combine the owner and members into one array
      const allMembers: BoardMember[] = [
        {
          id: boardData.user_id,
          email: ownerProfile?.email || 'Owner',
          role: 'owner'
        }
      ]
      
      // If there are other members, fetch their profiles
      if (membersData && membersData.length > 0) {
        // Get all user IDs
        const memberUserIds = membersData.map(member => member.user_id)
        
        // Fetch all profiles in one query
        const { data: memberProfiles, error: memberProfilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', memberUserIds)
        
        if (memberProfilesError) {
          console.warn('Error fetching member profiles:', memberProfilesError)
        }
        
        // Create a map for quick lookup
        const profileMap = new Map()
        if (memberProfiles) {
          memberProfiles.forEach(profile => {
            profileMap.set(profile.id, profile.email)
          })
        }
        
        // Add members with their emails
        membersData.forEach(member => {
          allMembers.push({
            id: member.user_id,
            email: profileMap.get(member.user_id) || 'Unknown',
            role: member.role
          })
        })
      }
      
      setMembers(allMembers)
    } catch (error) {
      console.error('Error fetching board members:', error)
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    
    if (!email.trim()) return
    
    try {
      // First check if the user exists by checking the auth.users table via profiles
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email.trim())
        .maybeSingle()
      
      if (userError) {
        console.error('Error checking user:', userError)
        setErrorMessage('Error checking user. Please try again.')
        return
      }
      
      if (!userData) {
        setErrorMessage('User not found. Please check the email address.')
        return
      }
      
      // Check if the user is already a member
      const isAlreadyMember = members.some(member => member.id === userData.id)
      if (isAlreadyMember) {
        setErrorMessage('This user is already a member of this board.')
        return
      }
      
      // Add the user as a board member
      const { error: insertError } = await supabase
        .from('board_members')
        .insert([
          {
            board_id: boardId,
            user_id: userData.id,
            role: 'member'
          }
        ])
      
      if (insertError) {
        console.error('Error adding board member:', insertError)
        setErrorMessage(`Failed to invite member: ${insertError.message}`)
        return
      }
      
      setSuccessMessage(`Successfully invited ${email}`)
      setEmail('')
      fetchBoardMembers()
    } catch (error: any) {
      console.error('Error inviting member:', error)
      setErrorMessage(`Failed to invite member: ${error.message || 'Unknown error'}`)
    }
  }

  const removeMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Refresh the member list
      fetchBoardMembers()
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <span className="text-lg">👥</span>
        <span>{members.length} Members</span>
      </button>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="bg-[#161b22] rounded-lg shadow-2xl border border-[#30363d] w-full max-w-md mx-auto overflow-hidden relative max-h-[80vh] flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="flex justify-between items-center border-b border-[#30363d] p-4 sticky top-0 bg-[#161b22] z-10">
              <h3 className="text-lg font-semibold text-gray-100">Board Members</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-200 text-xl p-2"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {/* Member list */}
              <div className="mb-6">
                <h4 className="text-gray-400 text-sm mb-2">Members</h4>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto">
                    {members.map(member => (
                      <div 
                        key={member.id} 
                        className="bg-[#1c2129] p-3 rounded-md border border-[#30363d] flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400">{member.email}</span>
                            {member.role === 'owner' && (
                              <span className="text-xs bg-purple-800 text-purple-200 px-2 py-0.5 rounded">Owner</span>
                            )}
                          </div>
                        </div>
                        {member.role !== 'owner' && isOwner && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Invitation form */}
              {isOwner && (
                <div className="border-t border-[#30363d] pt-4">
                  <h4 className="text-gray-400 text-sm mb-2">Invite Member</h4>
                  <form onSubmit={inviteMember}>
                    <div className="mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full p-2 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
                      />
                    </div>
                    {errorMessage && (
                      <p className="text-red-400 text-xs mb-2">{errorMessage}</p>
                    )}
                    {successMessage && (
                      <p className="text-green-400 text-xs mb-2">{successMessage}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!email.trim()}
                        className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Invitation
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}