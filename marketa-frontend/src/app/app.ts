import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink], // УБЕДИСЬ, ЧТО ОНИ ТУТ ЕСТЬ
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'marketa-frontend';
}