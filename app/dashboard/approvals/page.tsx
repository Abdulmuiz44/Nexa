'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals?action=pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setApprovals(data.pending || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string, content?: string) => {
    try {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'approve',
          approval_id: approvalId,
          edited_content: content
        })
      });
      fetchApprovals();
      setEditingId(null);
    } catch (error) {
      console.error('Error approving post:', error);
    }
  };

  const handleReject = async (approvalId: string, feedback?: string) => {
    try {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'reject',
          approval_id: approvalId,
          feedback
        })
      });
      fetchApprovals();
    } catch (error) {
      console.error('Error rejecting post:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading approvals...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve AI-generated posts before they go live
        </p>
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No posts pending approval. All set! 🎉
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {approval.post?.platform?.toUpperCase()} Post
                    </CardTitle>
                    <CardDescription>
                      Scheduled for: {approval.post?.scheduled_at 
                        ? new Date(approval.post.scheduled_at).toLocaleString()
                        : 'Not scheduled'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === approval.id ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{approval.original_content}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {editingId === approval.id ? (
                    <>
                      <Button
                        onClick={() => handleApprove(approval.id, editedContent)}
                        className="flex-1"
                      >
                        Save & Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditedContent('');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleApprove(approval.id)}
                        className="flex-1"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(approval.id);
                          setEditedContent(approval.original_content);
                        }}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(approval.id)}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
