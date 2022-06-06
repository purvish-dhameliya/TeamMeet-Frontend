import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/myerrorstatematcher';
import {AuthService} from 'src/service/auth.service';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { VerifyComponent } from '../verify/verify.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  forgotpassword:boolean = false;
  login:boolean = true; 
  form: FormGroup;
  resetForm: FormGroup;
  matcher = new MyErrorStateMatcher();
  msg:string="";
  uid:any;
  navShow:boolean = true;
  loadSpinner:boolean = true;
  constructor(private router:Router,private fb: FormBuilder, private authService:AuthService, private _snackBar: MatSnackBar,private dialog:MatDialog) {
    this.form = this.fb.group({
      emailctrl: ['', [Validators.required, Validators.email,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
      password: ['', [Validators.required]],
    });
    this.resetForm =this.fb.group({
      email:['',[Validators.required,Validators.email,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]]
    })
  }

  ngOnInit(): void {
  var user = localStorage.getItem('user')
  var token =localStorage.getItem('token')

    if(user && token ){
      this.router.navigateByUrl('/dashboard')
      return
    }
    this.loadSpinner = false
  }

  horizontalPosition: MatSnackBarHorizontalPosition = 'right';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  durationInSeconds = 5;

  openSnackBar(message: string, action: string, className: string) {

    this._snackBar.open(message, action, {
     duration: 5000,
     verticalPosition: 'top',
     horizontalPosition: 'right',
     panelClass: [className],
   });
  }
  get emailctrl(): any {
    return this.form.get('emailctrl');
  }

  get password(): any {
    return this.form.get('password');
  }

  get resetemail():any{return this.resetForm.get('email')}

  hide = true;

  onLogin(f: any): void {
    this.loadSpinner = true
    this.authService.login({email:f.value.emailctrl,pass:f.value.password}).subscribe(
      async data=> {
        this.msg=JSON.stringify(data.msg)

        if(data.msg=="not-verified"){
          this.loadSpinner = false
          this.openDialog(data.id)
        }
        else{
        var token=JSON.stringify(data.token);
        localStorage.setItem('token',token)
          this.authService.verify().subscribe(
            (value:any)=> {
              if(value){
                this.uid = value.user.id
                this.authService.getUser(this.uid).subscribe(
                  (data)=>{
                    if(data){
                      var user = JSON.stringify(data)
                      localStorage.setItem('user',user)  
                      this.loadSpinner = false
                      this.router.navigate(['dashboard']);
                    }
                    else{
                      console.error("exception no response from api");
                    }
                  },
                  error=>{console.error("exception"+JSON.stringify(error))}
                );
              }
            }
          );
        
        }
      },
      error => {console.error("Exception"+JSON.stringify(error.error));
      this.loadSpinner = false
      this.msg= JSON.stringify(error.error);
      console.log(error.error)
      if(error.error == "Password Incorrect"){
        this.openSnackBar("Password Incorrect",'Close','red-snackbar');
        this.form.setErrors({'Invalid':true});
        this.form.markAsTouched()
        // this.form.reset()
      }else if(error.error=="User Not Exist"){
        this.openSnackBar("User Not Exist",'Close','red-snackbar');
        this.form.setErrors({'Invalid':true});
        // this.form.reset()
      }
      else 
        {
          this.form.markAsPristine;
          this.form.markAsUntouched;
          this.openSnackBar("Request Timeout Or Server Error",'Close','red-snackbar');}
    }
    )
  }

  openDialog(id:any): void {
    const dialogRef = this.dialog.open(VerifyComponent,{
      width: '550px',
      // maxHeight: '90vh'
      height:'auto',
      data: {
        id:id
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ngOnInit();
    });
  }

  forgotshow(){
    this.login = !this.login;
    this.forgotpassword = !this.forgotpassword; 
  }

  sendforgotlink(email:string){
    if(email == ''){
      return
    }
    else if(email){
      this.loadSpinner = true;
      this.authService.sendforgotlink(email).subscribe((res)=>{
        if(res){
          if(res.msg=="successfully sended"){
            this.loadSpinner = false
            this._snackBar.open('Reset Link Successfully sended. If you can not found mail in inbox then please also check in spam section.','ok',{duration:6000,horizontalPosition:'right',verticalPosition:'top'})
            this.resetForm.reset()
            this.forgotshow()
          }
          if(res.msg =="server error"){
            this.loadSpinner = false
            this._snackBar.open('Server Error Try after some time.','ok',{duration:6000,horizontalPosition:'right',verticalPosition:'top',panelClass:'redsnackbar'})
          }
        }
      },(error)=>{
        this.loadSpinner = false
        if(error.error.msg == "No User Exist")
        {
          this._snackBar.open('Invalid Email Or Email Not Founded','ok',{duration:6000,panelClass:'red-snackbar',horizontalPosition:'right',verticalPosition:'top'})
        }
        else if(error.error.msg=="Fetching data error"){
          this._snackBar.open('Request Time Out','ok',{duration:6000,panelClass:'red-snackbar',horizontalPosition:'right',verticalPosition:'top'})
        }
        else{
          this._snackBar.open('Request Time Out','ok',{duration:6000,panelClass:'red-snackbar',horizontalPosition:'right',verticalPosition:'top'})
        }
        this.resetForm.reset()
        console.log(error.error)
      })
    }
  }
}


