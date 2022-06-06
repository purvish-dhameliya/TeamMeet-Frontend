//@ts-nocheck
import { Component, OnInit, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/service/auth.service';
import { CopyComponent } from './copy.component';
import { UserProfileComponent } from './user-profile/user-profile.component'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit { 
  uid="";
  loadSpinner:boolean = true;
  unbounded = false;
  user={"id":"","fname":'',"lname":'','mobile':"",'email':"",'pass':""};
  fname:string="";
  isLoggedIn:boolean=false;
  profileurl = "";
  constructor(private router:Router,private authService:AuthService,public dialog: MatDialog,public snackbar:MatSnackBar) {  }

  async ngOnInit(): Promise<void> {
    if(localStorage.getItem('user')){}else{this.router.navigateByUrl('/login'); return}
  
    this.user = JSON.parse(localStorage.getItem('user'))
    setTimeout(() => {
      this.fname = this.user.fname
    this.uid = this.user.id
    this.authService.getProfile(this.uid).subscribe(res=>{
      if(res){this.profileurl = res;localStorage.setItem('profilepic',this.profileurl)}
      else{return}
    })
    }, 1000);
    setTimeout(()=>{
      this.loadSpinner = false;
    },1000)
    
  }
  isRoom(){
    if(location.pathname=='/room'){return false}
    return true
  } 


  
  openDialog(): void {
    const dialogRef = this.dialog.open(UserProfileComponent,{
      width: '550px',
      height:'auto'
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ngOnInit();
    });
  }

  isNumberKey(evt:any){
    var charCode = (evt.which) ? evt.which : evt.keyCode
    
    if (charCode > 31 && (charCode < 48 || charCode > 57)){
      this.snackbar.open("Only Numbers Allowed In Room Id",'ok',{duration:2000});
        return false;
    } else{
        return true;
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    //@ts-ignore
    let dataToPaste = event.clipboardData.getData('text');
    if(!dataToPaste.match(/^[0-9]+$/)){
      event.preventDefault()
      this.snackbar.open("Only Numbers Allowed",'ok',{duration:2000})
    }
  }
  
  joinRoom(value:any){
    var len = value.length;
    if(value != '' && value != undefined && value != value.replace(/\s/g, '').length && value !== " " && value.match(/^[0-9]+$/))
    {
      if (len < 6){
        this.snackbar.open("6 Digit Required In Room Id",'ok',{duration:2000});
        return;
      }
      else{
        this.authService.findroom({"roomid":value,"uid":this.user.id}).subscribe((res)=>{
          if(res.msg=="room-not-exist"){
            this.snackbar.open(`Room no ${value} is not exist`,'OK',{duration:3000,verticalPosition:"top",horizontalPosition:"right"})
            return
          }
          else if(res.msg=="room-exist"){
            if(res.numberofuser < 91){
              localStorage.setItem('roomId',value)
              this.router.navigate(['/room'])
            } else {
              this.snackbar.open(`Room Number ${value} is Full`,'OK',{duration:3000,verticalPosition:"top",horizontalPosition:"right"})
              return
            }
          }
        })
      }
    }else{document.getElementById('roomId').value = "";this.snackbar.open("Only Numbers Allowed In Room Id",'ok',{duration:2000});
  }
  }


  LogOut(){
    localStorage.removeItem('token');
    localStorage.removeItem('uid');
    localStorage.removeItem('roomid');
    localStorage.removeItem('profilepic');
    this.uid="";
    this.user={"id":"","fname":'',"lname":'','mobile':"",'email':"",'pass':""};
    localStorage.removeItem('user')
    this.router.navigate(['login']); 
  }

  createNewRoom(){
    var RoomId = Math.floor(100000 + Math.random() * 900000);

    localStorage.setItem('roomId',RoomId);
    localStorage.setItem('admin','admin')
    var data = { "roomid": RoomId, "uid": this.user.id }
      this.authService.room(data).subscribe((res) => {
        if (res) { console.log(res) 
          if(res.msg=="room Inserted"){
          this.snackbar.openFromComponent(CopyComponent, { duration:8000,horizontalPosition:'right', verticalPosition:'top',data:RoomId});
          this.router.navigate(['/room'])
          }
        }
      },error=>{
        this.snackbar.open('Server Error. Try after some time.','ok',{duration:8000,horizontalPosition:'right', verticalPosition:'top',panelClass:'red-snackbar'});console.log(error)
      })
  }

}
