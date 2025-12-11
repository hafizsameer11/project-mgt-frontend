import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import api from '../services/api';

export default function FinancialReports() {
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchProfitLoss = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial-reports/profit-loss', {
        params: { start_date: startDate, end_date: endDate },
      });
      setProfitLoss(response.data);
    } catch (error) {
      console.error('Error fetching profit & loss:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial-reports/balance-sheet', {
        params: { as_of_date: asOfDate },
      });
      setBalanceSheet(response.data);
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial-reports/cash-flow', {
        params: { start_date: startDate, end_date: endDate },
      });
      setCashFlow(response.data);
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [startDate, endDate]);

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  useEffect(() => {
    fetchCashFlow();
  }, [startDate, endDate]);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Financial Reports
        </h1>
        <p className="text-gray-600">View comprehensive financial reports</p>
      </div>

      <Tabs defaultValue="profit-loss" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <Card className="p-6">
            <div className="mb-4 flex gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button onClick={fetchProfitLoss} className="mt-6">Refresh</Button>
            </div>

            {profitLoss && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${profitLoss.revenue.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${profitLoss.expenses.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${profitLoss.net_profit.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card className="p-6">
            <div className="mb-4 flex gap-4">
              <Input
                label="As Of Date"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
              <Button onClick={fetchBalanceSheet} className="mt-6">Refresh</Button>
            </div>

            {balanceSheet && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Assets</p>
                    <p className="text-2xl font-bold">${balanceSheet.assets.total.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Liabilities</p>
                    <p className="text-2xl font-bold">${balanceSheet.liabilities.total.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Equity</p>
                    <p className="text-2xl font-bold">${balanceSheet.equity.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow">
          <Card className="p-6">
            <div className="mb-4 flex gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button onClick={fetchCashFlow} className="mt-6">Refresh</Button>
            </div>

            {cashFlow && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Operating Activities</p>
                    <p className="text-2xl font-bold">${cashFlow.operating_activities.net.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Investing Activities</p>
                    <p className="text-2xl font-bold">${cashFlow.investing_activities.net.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Net Cash Flow</p>
                    <p className="text-2xl font-bold">${cashFlow.net_cash_flow.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

