'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  tx_type: string;
  credits: number;
  description?: string;
  reference_id?: string;
  operation_type?: string;
  operation_id?: string;
  created_at: string;
}

export function AdminTransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, search, typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/credits/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'earn':
        return 'default';
      case 'spend':
        return 'destructive';
      case 'purchase':
        return 'secondary';
      case 'refund':
        return 'outline';
      case 'adjust':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user email or transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="earn">Earn</SelectItem>
              <SelectItem value="spend">Spend</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="adjust">Adjust</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(transaction.created_at).toLocaleDateString()} {' '}
                      {new Date(transaction.created_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.user_email}</div>
                        {transaction.user_name && (
                          <div className="text-sm text-muted-foreground">{transaction.user_name}</div>
                        )}
                        <div className="text-xs text-muted-foreground font-mono">
                          {transaction.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeVariant(transaction.tx_type)}>
                        {formatTransactionType(transaction.tx_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono font-medium ${
                        transaction.credits > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.credits > 0 ? '+' : ''}{transaction.credits}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      {transaction.operation_type && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.operation_type}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
