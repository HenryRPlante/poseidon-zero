import { Component } from '@angular/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {

  selectedSegment = 'live';

  waterTemp = 22.4;
  turbidity = 3.1;
  airTemp = 24.8;

}
