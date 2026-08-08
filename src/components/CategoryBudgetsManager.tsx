import { useMemo, useState } from "react";
import { SectionCard, SectionEmpty, SectionLoading } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle, ChevronLeft, ChevronRight, Copy, Edit2, PiggyBank, Plus, Trash2, Wallet,
} from "lucide-react";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { formatCurrency, Language } from "@/lib/i18n";
import {
  useAddExpenseCategory, useCategoryBudgets, useCategorySpending, useCopyBudgetsFromPreviousMonth,
  useDeleteCategoryBudget, useDeleteExpenseCategory, useExpenseCategories, useSaveCategoryBudget,
} from "@/hooks/useCategoryBudgets";
import { useToast } from "@/hooks/use-toast";

const copy = {
  en: {
    title: "Monthly budget by category",
    description: "Set a spending limit per category and get warned at 80% and 100% of the limit.",
    newCategory: "New category",
    categoryName: "Category name",
    setLimit: "Set limit",
    editLimit: "Edit limit",
    limit: "Monthly limit",
    spent: "Spent",
    remaining: "Remaining",
    over: "Over budget by",
    noLimit: "No limit set",
    noCategories: "No categories yet",
    noCategoriesHint: "Create a category (e.g. Groceries, Transport) to start budgeting your variable expenses.",
    monthTotal: "Budgeted",
    totalSpent: "Total spent",
    uncategorized: "Uncategorized spending",
    copyPrevious: "Copy last month",
    save: "Save",
    cancel: "Cancel",
    remove: "Remove limit",
    deleteCategory: "Delete category",
    deleteCategoryConfirm: "Deleting this category also removes its limits. The expenses stay, but become uncategorized.",
    warning80: "categories reached 80% of their limit.",
    warning100: "categories are over budget.",
    savedLimit: "Limit saved",
    categoryCreated: "Category created",
    ok: "On track",
    near: "Close to limit",
    exceeded: "Over budget",
  },
  es: {
    title: "Presupuesto mensual por categoría",
    description: "Define un límite de gasto por categoría y recibe avisos al 80% y al 100% del límite.",
    newCategory: "Nueva categoría",
    categoryName: "Nombre de la categoría",
    setLimit: "Definir límite",
    editLimit: "Editar límite",
    limit: "Límite mensual",
    spent: "Gastado",
    remaining: "Disponible",
    over: "Excedido por",
    noLimit: "Sin límite definido",
    noCategories: "Aún no hay categorías",
    noCategoriesHint: "Crea una categoría (p. ej. Supermercado, Transporte) para empezar a presupuestar tus gastos variables.",
    monthTotal: "Presupuestado",
    totalSpent: "Gasto total",
    uncategorized: "Gasto sin categoría",
    copyPrevious: "Copiar mes anterior",
    save: "Guardar",
    cancel: "Cancelar",
    remove: "Quitar límite",
    deleteCategory: "Eliminar categoría",
    deleteCategoryConfirm: "Al eliminar la categoría también se eliminan sus límites. Los gastos se mantienen, pero quedan sin categoría.",
    warning80: "categorías llegaron al 80% de su límite.",
    warning100: "categorías superaron el presupuesto.",
    savedLimit: "Límite guardado",
    categoryCreated: "Categoría creada",
    ok: "En orden",
    near: "Cerca del límite",
    exceeded: "Excedido",
  },
  pt: {
    title: "Orçamento mensal por categoria",
    description: "Defina um limite de gasto por categoria e receba avisos aos 80% e 100% do limite.",
    newCategory: "Nova categoria",
    categoryName: "Nome da categoria",
    setLimit: "Definir limite",
    editLimit: "Editar limite",
    limit: "Limite mensal",
    spent: "Gasto",
    remaining: "Disponível",
    over: "Excedido em",
    noLimit: "Sem limite definido",
    noCategories: "Ainda sem categorias",
    noCategoriesHint: "Crie uma categoria (ex.: Supermercado, Transporte) para começar a orçamentar as despesas variáveis.",
    monthTotal: "Orçamentado",
    totalSpent: "Gasto total",
    uncategorized: "Gasto sem categoria",
    copyPrevious: "Copiar mês anterior",
    save: "Guardar",
    cancel: "Cancelar",
    remove: "Remover limite",
    deleteCategory: "Eliminar categoria",
    deleteCategoryConfirm: "Ao eliminar a categoria também se eliminam os seus limites. As despesas permanecem, mas ficam sem categoria.",
    warning80: "categorias atingiram 80% do limite.",
    warning100: "categorias ultrapassaram o orçamento.",
    savedLimit: "Limite guardado",
    categoryCreated: "Categoria criada",
    ok: "Em ordem",
    near: "Perto do limite",
    exceeded: "Excedido",
  },
} as const;

interface Props {
  language?: Language;
}

export const CategoryBudgetsManager = ({ language = "en" }: Props) => {
  const t = copy[language] ?? copy.en;
  const { toast } = useToast();

  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [limitTarget, setLimitTarget] = useState<{ id: string; name: string; existingId?: string } | null>(null);
  const [limitValue, setLimitValue] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const { data: categories = [], isLoading: loadingCategories } = useExpenseCategories();
  const { data: budgets = [], isLoading: loadingBudgets } = useCategoryBudgets(month);
  const { data: spending } = useCategorySpending(month);

  const addCategory = useAddExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();
  const saveBudget = useSaveCategoryBudget(month);
  const deleteBudget = useDeleteCategoryBudget();
  const copyPrevious = useCopyBudgetsFromPreviousMonth(month);

  const rows = useMemo(() => {
    return categories.map((category) => {
      const budget = budgets.find((b) => b.category_id === category.id);
      const limit = budget?.limit_amount ?? 0;
      const spent = spending?.byCategory[category.id] ?? 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const status = limit <= 0 ? "none" : percent >= 100 ? "exceeded" : percent >= 80 ? "near" : "ok";
      return { category, budget, limit, spent, percent, status };
    });
  }, [categories, budgets, spending]);

  const totals = useMemo(() => ({
    budgeted: rows.reduce((sum, r) => sum + r.limit, 0),
    spent: spending?.total ?? 0,
    near: rows.filter((r) => r.status === "near").length,
    exceeded: rows.filter((r) => r.status === "exceeded").length,
  }), [rows, spending]);

  const openLimitDialog = (row: (typeof rows)[number]) => {
    setLimitTarget({ id: row.category.id, name: row.category.name, existingId: row.budget?.id });
    setLimitValue(row.limit > 0 ? String(row.limit) : "");
  };

  const handleSaveLimit = () => {
    if (!limitTarget) return;
    const amount = parseFloat(limitValue);
    if (!Number.isFinite(amount) || amount < 0) return;
    saveBudget.mutate(
      { categoryId: limitTarget.id, limitAmount: amount, existingId: limitTarget.existingId },
      {
        onSuccess: () => {
          toast({ title: t.savedLimit, description: `${limitTarget.name}: ${formatCurrency(amount)}` });
          setLimitTarget(null);
          setLimitValue("");
        },
      },
    );
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory.mutate(
      { name: newCategoryName },
      {
        onSuccess: () => {
          toast({ title: t.categoryCreated, description: newCategoryName.trim() });
          setNewCategoryName("");
          setCategoryDialogOpen(false);
        },
      },
    );
  };

  const statusBadge = (status: string) => {
    if (status === "exceeded") return <Badge variant="destructive">{t.exceeded}</Badge>;
    if (status === "near") return <Badge className="bg-warning text-warning-foreground hover:bg-warning">{t.near}</Badge>;
    if (status === "ok") return <Badge variant="secondary">{t.ok}</Badge>;
    return <Badge variant="outline">{t.noLimit}</Badge>;
  };

  const isLoading = loadingCategories || loadingBudgets;

  return (
    <>
      <SectionCard
        accent="expense"
        icon={Wallet}
        title={t.title}
        description={t.description}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copyPrevious.mutate()}
              disabled={copyPrevious.isPending}
            >
              <Copy className="h-4 w-4" />
              {t.copyPrevious}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setCategoryDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              {t.newCategory}
            </Button>
          </>
        }
        headerExtra={
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Previous month" data-testid="budget-prev-month" onClick={() => setMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="font-semibold" data-testid="budget-month-label">{format(month, "MMMM yyyy")}</p>
              <p className="text-sm text-muted-foreground">
                {t.monthTotal}: <span className="font-bold">{formatCurrency(totals.budgeted)}</span>
                {" · "}
                {t.totalSpent}: <span className="font-bold text-warning">{formatCurrency(totals.spent)}</span>
              </p>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Next month" data-testid="budget-next-month" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        {(totals.exceeded > 0 || totals.near > 0) && (
          <Alert variant={totals.exceeded > 0 ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {totals.exceeded > 0 && <span>{totals.exceeded} {t.warning100} </span>}
              {totals.near > 0 && <span>{totals.near} {t.warning80}</span>}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <SectionLoading />
        ) : rows.length === 0 ? (
          <SectionEmpty
            icon={PiggyBank}
            title={t.noCategories}
            description={t.noCategoriesHint}
            action={
              <Button size="sm" className="gap-2" onClick={() => setCategoryDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                {t.newCategory}
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const remaining = row.limit - row.spent;
              return (
                <div key={row.category.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold truncate">{row.category.name}</p>
                      {statusBadge(row.status)}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openLimitDialog(row)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {row.budget && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => deleteBudget.mutate(row.budget!.id)}
                        >
                          {t.remove}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteCategoryId(row.category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {row.limit > 0 ? (
                    <>
                      <Progress
                        value={Math.min(100, row.percent)}
                        className={row.status === "exceeded" ? "[&>div]:bg-destructive" : row.status === "near" ? "[&>div]:bg-warning" : undefined}
                      />
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {t.spent}: <span className="font-semibold text-warning">{formatCurrency(row.spent)}</span>
                          {" / "}
                          {formatCurrency(row.limit)} ({Math.round(row.percent)}%)
                        </span>
                        <span className={remaining < 0 ? "font-semibold text-destructive" : "font-semibold text-income"}>
                          {remaining < 0
                            ? `${t.over} ${formatCurrency(Math.abs(remaining))}`
                            : `${t.remaining}: ${formatCurrency(remaining)}`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {t.spent}: <span className="font-semibold text-warning">{formatCurrency(row.spent)}</span>
                      </span>
                      <Button size="sm" variant="outline" onClick={() => openLimitDialog(row)}>
                        {t.setLimit}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {(spending?.uncategorized ?? 0) > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
                <span className="text-muted-foreground">{t.uncategorized}</span>
                <span className="font-semibold">{formatCurrency(spending!.uncategorized)}</span>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* New category */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.newCategory}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="budget-category-name">{t.categoryName}</Label>
            <Input
              id="budget-category-name"
              maxLength={60}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleCreateCategory} disabled={addCategory.isPending}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limit dialog */}
      <Dialog open={!!limitTarget} onOpenChange={(open) => !open && setLimitTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{limitTarget?.existingId ? t.editLimit : t.setLimit} — {limitTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="budget-limit">{t.limit} ({format(month, "MMMM yyyy")})</Label>
            <Input
              id="budget-limit"
              type="number"
              min="0"
              step="0.01"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveLimit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLimitTarget(null)}>{t.cancel}</Button>
            <Button onClick={handleSaveLimit} disabled={saveBudget.isPending}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete category */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteCategory}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteCategoryConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCategoryId) deleteCategory.mutate(deleteCategoryId);
                setDeleteCategoryId(null);
              }}
            >
              {t.deleteCategory}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
