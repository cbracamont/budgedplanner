{
  /* TABS */
}
<Tabs defaultValue="overview" className="no-print">
  <TabsList className="grid w-full grid-cols-4 mb-6">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="income">Income</TabsTrigger>
    <TabsTrigger value="expenses">Expenses</TabsTrigger>
    <TabsTrigger value="debts">Debts</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <Card>
      <CardHeader>
        <CardTitle>Family Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-6xl font-bold text-center text-blue-600">{cashFlow > 0 ? "Healthy" : "Review"}</div>
        <Progress value={cashFlow > 0 ? 80 : 40} className="mt-4" />
      </CardContent>
    </Card>
  </TabsContent>

  {/* === INCOME TAB CON VARIABLE INCOME === */}
  <TabsContent value="income">
    <Tabs defaultValue="fixed" className="mt-6">
      <TabsList>
        <TabsTrigger value="fixed">Fixed Income</TabsTrigger>
        <TabsTrigger value="variable">Variable Income</TabsTrigger>
      </TabsList>

      <TabsContent value="fixed">
        <IncomeManager language={language} />
      </TabsContent>

      <TabsContent value="variable">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Variable Income
              <Button
                size="sm"
                onClick={() => {
                  const desc = prompt("Description (e.g. Bonus, Freelance)");
                  const amount = parseFloat(prompt("Amount (£)") || "0");
                  if (desc && amount > 0) addIncome(amount, desc);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardTitle>
            <CardDescription>Extra income like bonuses, gifts, side hustles</CardDescription>
          </CardHeader>
          <CardContent>
            {variableIncome.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No variable income yet</p>
            ) : (
              <div className="space-y-2">
                {variableIncome.map((inc) => (
                  <div key={inc.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{inc.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(inc.date), "d MMM yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">{formatCurrency(inc.amount)}</span>
                      <Button size="sm" variant="ghost" onClick={() => deleteIncome(inc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </TabsContent>

  {/* === EXPENSES (YA TENÍA SUBCATEGORÍAS) === */}
  <TabsContent value="expenses">
    <Tabs defaultValue="fixed" className="mt-6">
      <TabsList>
        <TabsTrigger value="fixed">Fixed</TabsTrigger>
        <TabsTrigger value="variable">Variable</TabsTrigger>
      </TabsList>
      <TabsContent value="fixed">
        <FixedExpensesManager language={language} />
      </TabsContent>
      <TabsContent value="variable">
        <VariableExpensesManager language={language} />
      </TabsContent>
    </Tabs>
  </TabsContent>

  <TabsContent value="debts">
    <DebtsManager language={language} />
  </TabsContent>
</Tabs>;
