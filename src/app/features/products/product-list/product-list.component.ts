import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProductFacade} from '../../../api-facade/products/productFacade';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-list">
      <h2>Liste des Produits</h2>


      <div class="products-grid">
        @for (product of products(); track product.id) {
          <div class="product-card">
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
            <p class="price">{{ product.basePrice | currency:'EUR' }}</p>
            <p>Stock: {{ product.categoryName }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .product-list {
      padding: 20px;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .product-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .price {
      font-size: 1.2em;
      font-weight: bold;
      color: #2196F3;
    }

    .error {
      color: red;
      padding: 10px;
      background: #ffebee;
      border-radius: 4px;
    }
  `]
})
export class ProductListComponent implements OnInit {
  private productFacade = inject(ProductFacade);

  readonly products = this.productFacade.products;

  ngOnInit() {
    this.productFacade.loadProducts();
  }

}
