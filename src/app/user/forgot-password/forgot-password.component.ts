import { Component, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup,Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { passvalidator } from 'src/app/validators';
import { MyErrorStateMatcher } from 'src/app/myerrorstatematcher';
import { AuthService } from 'src/service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.css']
})


export class ForgotPasswordComponent implements OnInit {
  token:any = "";
  form:FormGroup
  matcher= new MyErrorStateMatcher();
  hide = true;
  hide1 = true;

 
  constructor(private fb: FormBuilder,private snackbar:MatSnackBar,private router:Router,private route: ActivatedRoute,private authservice:AuthService) {
    this.form = this.fb.group({
      password: ['',[Validators.required,]],
      confirmpassword: ['',[Validators.required, passvalidator]]
    });
   }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token')
  }
 get password():any{
    return this.form.get('password')
  }
  
  get confirmpassword():any{
    return this.form.get('confirmpassword')
  }

  onReset(f:FormGroup){
    if(f.valid){
      var data = {'token':this.token,"password":f.value.password}
      this.authservice.resetPassword(data).subscribe(res=>{
        if(res){
          if(res.msg=="Password Updated")
          this.snackbar.open('Password Updated','ok',{horizontalPosition:'right','verticalPosition':'top',duration:6000})
          this.router.navigateByUrl('/login')
        }
      },err=>{
        console.log(err)
        if(err.error.msg=="Invalid Link Or Link Expired"){
          this.snackbar.open('Link Expired','ok',{horizontalPosition:'right','verticalPosition':'top',duration:6000,panelClass:'red-snackbar'})
          console.log("link Expired")
          this.router.navigateByUrl('/login')
        }
      })
    }
  }
  
}
