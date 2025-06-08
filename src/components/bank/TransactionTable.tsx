
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Calendar, DollarSign, Building2, User } from "lucide-react";
import { BankTransaction } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransactionTableProps {
  transactions: BankTransaction[];
  onEdit: (transaction: BankTransaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable = ({ transactions, onEdit, onDelete }: TransactionTableProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className={`border-l-4 ${transaction.type === 'deposit' ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header with date and amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                  <div className={`text-lg font-bold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                </div>

                {/* Description */}
                <div className="font-medium text-gray-900">{transaction.description}</div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.type === 'deposit' ? 'default' : 'destructive'} className="text-xs">
                        {transaction.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {transaction.clients?.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <div className="truncate">
                          <div className="font-medium text-xs">{transaction.clients.company}</div>
                          {transaction.projects?.name && (
                            <div className="text-xs text-gray-500 truncate">{transaction.projects.name}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {transaction.profiles?.full_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">{transaction.profiles.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(transaction)}
                    className="flex-1 text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(transaction.id)}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg font-medium mb-2">No transactions found</div>
            <p className="text-sm">Start by adding your first transaction</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Client/Project</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Profile</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-gray-600">
                {new Date(transaction.date).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-gray-900">{transaction.description}</td>
              <td className="py-3 px-4">
                <Badge variant="outline">{transaction.category}</Badge>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {transaction.clients?.company && (
                  <div>
                    <div className="font-medium">{transaction.clients.company}</div>
                    {transaction.projects?.name && (
                      <div className="text-sm text-gray-500">{transaction.projects.name}</div>
                    )}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-gray-600">
                {transaction.profiles?.full_name || 'N/A'}
              </td>
              <td className="py-3 px-4">
                <span className={`font-medium ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge variant={transaction.type === 'deposit' ? 'default' : 'destructive'}>
                  {transaction.type}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(transaction)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
