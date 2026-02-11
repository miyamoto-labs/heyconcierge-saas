import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isAdmin } from '@/lib/supabase'

// GET /api/admin/stats - Get dashboard stats (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const walletAddress = request.headers.get('x-wallet-address')
    
    if (!walletAddress || !isAdmin(walletAddress)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get skill counts by status
    const { data: skills } = await supabaseAdmin
      .from('skills')
      .select('status')
    
    const stats = {
      total: skills?.length || 0,
      pending: skills?.filter((s: { status: string }) => s.status === 'pending').length || 0,
      scanning: skills?.filter((s: { status: string }) => s.status === 'scanning').length || 0,
      verified: skills?.filter((s: { status: string }) => s.status === 'verified').length || 0,
      rejected: skills?.filter((s: { status: string }) => s.status === 'rejected').length || 0,
      blocked: skills?.filter((s: { status: string }) => s.status === 'blocked').length || 0,
    }
    
    // Get publisher count
    const { count: publisherCount } = await supabaseAdmin
      .from('publishers')
      .select('*', { count: 'exact', head: true })
    
    // Get total downloads
    const { data: downloadData } = await supabaseAdmin
      .from('skills')
      .select('downloads')
    
    const totalDownloads = downloadData?.reduce((sum: number, s: { downloads: number }) => sum + (s.downloads || 0), 0) || 0
    
    // Get pending reports
    const { count: pendingReports } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentSubmissions } = await supabaseAdmin
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
    
    return NextResponse.json({
      skills: stats,
      publishers: publisherCount || 0,
      totalDownloads,
      pendingReports: pendingReports || 0,
      recentSubmissions: recentSubmissions || 0,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
