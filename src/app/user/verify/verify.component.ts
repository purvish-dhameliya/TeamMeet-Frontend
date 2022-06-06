import { Component, Inject, OnInit, HostListener } from '@angular/core';
import { AuthService } from 'src/service/auth.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RegistrationComponent } from '../registration/registration.component';
import { Router } from '@angular/router';
import { timer } from "rxjs";
import { Pipe, PipeTransform } from "@angular/core";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnInit {
  invaliderror: boolean=false;
  constructor(private authservice:AuthService,public dialogRef: MatDialogRef<RegistrationComponent>,
    @Inject(MAT_DIALOG_DATA) public data:{id:any},private router:Router,private snackbar:MatSnackBar) { }
countDown!: any;
counter:any = 60;
tick = 1000;
button:boolean=false;
isdisabled:boolean=false;
  ngOnInit(): void {
    console.log(this.data)
    this.authservice.resendotp({"uid":this.data.id}).subscribe(result=>{
      console.log(result);
      this.snackbar.open('New Otp Successfully sended. If you can not found mail in inbox then please also check in spam section.','ok',{duration:6000,horizontalPosition:'right',verticalPosition:'top'})
    },error=>{console.log(error);this.snackbar.open('Server Error. Try after some time.','ok',{duration:5000,verticalPosition:'top',horizontalPosition:'right',panelClass:'red-snackbar'})})
  }
  ngAfterViewInit(): void{
    this.countDown = timer(100, this.tick).subscribe(() => this.decresecounter());
    setTimeout(() => {
      this.button = true;
    }, 60000);
  }
  decresecounter(){
    --this.counter
    if(this.counter==0){
      this.countDown.unsubscribe()
      this.counter = "resend"
    }
  }

  isNumberKey(evt:any){
    var charCode = (evt.which) ? evt.which : evt.keyCode
    
    if (charCode > 31 && (charCode < 48 || charCode > 57)){
      this.snackbar.open("Only Numbers Allowed",'ok',{duration:2000});
        return false;
    } else{
        return true;
    }
  }

  checkOtp(value:any){
    if(!value.match(/^[0-9]+$/)){this.snackbar.open("Only Numbers Allowed",'ok',{duration:2000}); return}
    if (value.length < 6){
      this.snackbar.open("6 Digit Required",'ok',{duration:2000});
      return;
    }
    this.isdisabled=true;
    this.authservice.verifyotp({"uid":this.data.id,"otp":value}).subscribe(result=>{
      console.log(result)
      this.isdisabled=false;
      if(result.msg=="verified"){
        this.invaliderror = false;
        this.dialogRef.close()
        this.router.navigate(['/login'])
      }
      else if(result.msg=="Invalid"){
        this.invaliderror = true
      }
    },error=>{this.isdisabled=false;console.log(error);this.snackbar.open('Server Error. Try after some time.','ok',{duration:5000,verticalPosition:'top',horizontalPosition:'right',panelClass:'red-rsnackbar'})})
  }

  resend(){
      this.authservice.resendotp({"uid":this.data.id}).subscribe(result=>{
        this.isdisabled=false;
        console.log(result);
        this.snackbar.open('New Otp Successfully sended. If you can not found mail in inbox then please also check in spam section.','ok',{duration:6000,horizontalPosition:'right',verticalPosition:'top'})
        this.button = false;
        this.counter=60;
        this.countDown = timer(0, this.tick).subscribe(() =>this.decresecounter());
        setTimeout(() => {
          this.button = true;
        }, 60000);
      },error=>{
        console.log(error);
        this.snackbar.open('Server Error. Try after some time.','ok',{duration:5000,verticalPosition:'top',horizontalPosition:'right',panelClass:'red-snackbar'})
      })
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    //@ts-ignore
    let dataToPaste = event.clipboardData.getData('text');
    if(!dataToPaste.match(/^[0-9]+$/)){
      event.preventDefault()
      this.snackbar.open("Only Numbers Allowed",'ok',{duration:2000})
    }
   // Validate 'dataToPaste' against the regex
  }
}



@Pipe({
  name: "formatTime"
})
export class FormatTimePipe implements PipeTransform {
  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return (
      ("00" + minutes).slice(-2) +
      ":" +
      ("00" + Math.floor(value - minutes * 60)).slice(-2)
    );
  }
}
