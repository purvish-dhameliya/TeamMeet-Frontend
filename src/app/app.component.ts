import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'TeamMeet';
  constructor(private router:Router){}
  ngOnInit():void{}
  navLinks = [
    {path: 'registration' , label: 'Registration'},
    {path: 'login', label: 'Login'},
  ]

  checkNav(){
    if(location.pathname=='/login' || location.pathname=='/registration'){
      return true
    }
    return false
  }

}
