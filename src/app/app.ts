import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ProductListComponent} from './features/products/product-list/product-list.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProductListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('inventory-frontend');
}
