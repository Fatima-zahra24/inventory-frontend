import { Component, OnInit, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ProductFacade } from '../../api-facade/products/productFacade';
import { InventoryFacade } from '../../api-facade/inventory/inventoryFacade';
import { StockMovementFacade } from '../../api-facade/inventory/stockMovementFacade';
import { SupplierFacade } from '../../api-facade/suppliers/supplierFacade';
import { WarehouseFacade } from '../../api-facade/inventory/warehouseFacade';
import { OrderFacade } from '../../api-facade/orders/orderFacade';
import { IsAdminDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IsAdminDirective, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private productFacade = inject(ProductFacade);
  private inventoryFacade = inject(InventoryFacade);
  private movementFacade = inject(StockMovementFacade);
  private supplierFacade = inject(SupplierFacade);
  private warehouseFacade = inject(WarehouseFacade);
  private orderFacade = inject(OrderFacade);

  today = new Date();

  // Products
  readonly products = this.productFacade.products;
  readonly productLoading = this.productFacade.loading;

  // Inventory
  readonly stats = this.inventoryFacade.stats;
  readonly alerts = this.inventoryFacade.alerts;
  readonly inventories = this.inventoryFacade.inventories;

  // Movements
  readonly movements = this.movementFacade.movements;
  readonly movementLoading = this.movementFacade.loading;

  // Suppliers
  readonly suppliers = this.supplierFacade.suppliers;

  // Warehouses
  readonly warehouses = this.warehouseFacade.warehouses;

  // Orders
  readonly orders = this.orderFacade.orders;
  readonly orderStats = this.orderFacade.stats;
  readonly orderLoading = this.orderFacade.loading;

  // Chart data
  salesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ventes (DH)',
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      borderColor: 'rgba(79, 70, 229, 1)',
      borderWidth: 1,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(79, 70, 229, 1)'
    }]
  };

  salesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8/*,
        callbacks: {
          label: (context) => `${context.parsed.y.toLocaleString('fr-FR')} DH`
        }*/
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 12 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: { size: 12 },
          callback: (value) => `${value} DH`
        }
      }
    }
  };

  // Computed values
  totalProducts = () => this.products().length;
  activeProducts = () => this.products().filter(p => p.status === 'ACTIVE').length;
  inactiveProducts = () => this.products().filter(p => p.status === 'INACTIVE').length;
  outOfStockProducts = () => this.products().filter(p => p.status === 'OUT_OF_STOCK').length;
  recentProducts = () => this.products().slice(0, 5);

  totalWarehouses = () => this.warehouses().length;
  activeSuppliers = () => this.suppliers().filter(s => s.status === 'ACTIVE').length;

  totalMovements = () => this.movements().length;
  recentMovements = () => this.movements().slice(0, 6);

  alertsLimited = () => this.alerts().slice(0, 6);
  lowStockCount = () => this.alerts().filter(a => a.alertType === 'LOW_STOCK').length;

  recentOrders = () => this.orders().slice(0, 5);

  // Calculate sales for last 7 days
  salesByDay = computed(() => {
    const orders = this.orders();
    const salesMap = new Map<string, number>();

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = this.formatDateKey(date);
      salesMap.set(key, 0);
    }

    // Aggregate sales by day (only DELIVERED or PAID orders)
    orders.forEach(order => {
      if (order.createdAt && (order.status === 'DELIVERED' || order.paymentStatus === 'PAID')) {
        const orderDate = new Date(order.createdAt);
        const key = this.formatDateKey(orderDate);
        if (salesMap.has(key)) {
          salesMap.set(key, (salesMap.get(key) || 0) + (order.totalAmount || 0));
        }
      }
    });

    return salesMap;
  });

  totalSalesLast7Days = computed(() => {
    let total = 0;
    this.salesByDay().forEach(value => total += value);
    return total;
  });

  constructor() {
    // Effect to update chart when orders change
    effect(() => {
      const salesData = this.salesByDay();
      this.updateChartData(salesData);
    });
  }

  ngOnInit() {
    this.productFacade.loadProducts();
    this.inventoryFacade.loadAlerts();
    this.inventoryFacade.loadStats();
    this.movementFacade.loadMovements();
    this.supplierFacade.loadSuppliers();
    this.warehouseFacade.loadWarehouses();
    this.orderFacade.loadOrders();
    this.orderFacade.loadStats();
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return `${days[date.getDay()]} ${date.getDate()}`;
  }

  private updateChartData(salesMap: Map<string, number>) {
    const labels: string[] = [];
    const data: number[] = [];

    salesMap.forEach((value, key) => {
      labels.push(this.formatDateLabel(key));
      data.push(value);
    });

    this.salesChartData = {
      labels,
      datasets: [{
        data,
        label: 'Ventes (DH)',
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(79, 70, 229, 1)'
      }]
    };
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'INACTIVE': return 'Inactif';
      case 'DISCONTINUED': return 'Arrete';
      case 'OUT_OF_STOCK': return 'Rupture';
      default: return status;
    }
  }

  getOrderStatusLabel(status?: string): string {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'CONFIRMED': return 'Confirmee';
      case 'PROCESSING': return 'En cours';
      case 'SHIPPED': return 'Expediee';
      case 'DELIVERED': return 'Livree';
      case 'CANCELLED': return 'Annulee';
      case 'REFUNDED': return 'Remboursee';
      default: return status || '';
    }
  }

  getAlertSeverityClass(severity?: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      case 'LOW': return 'low';
      default: return 'medium';
    }
  }

  getMovementTypeClass(type: string): string {
    return this.isIncomingMovement(type) ? 'incoming' : 'outgoing';
  }

  isIncomingMovement(type: string): boolean {
    return ['IN', 'PURCHASE', 'RETURN', 'TRANSFER_IN'].includes(type);
  }

  getMovementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'IN': 'Entree',
      'OUT': 'Sortie',
      'PURCHASE': 'Achat',
      'SALE': 'Vente',
      'RETURN': 'Retour',
      'DAMAGE': 'Dommage',
      'TRANSFER_IN': 'Transfert entrant',
      'TRANSFER_OUT': 'Transfert sortant',
      'ADJUSTMENT': 'Ajustement'
    };
    return labels[type] || type;
  }
}
