import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class AuthService{
    constructor(private http: HttpClient){}
    baseurl ='https://nameless-garden-84208.herokuapp.com'
    // baseurl='https://192.168.43.119:5000'
    // baseurl='http://localhost:80'

    // console.log(id)
    public async upload(data:any,userid:string):Promise<Observable<any>>{
        var id = Math.floor(100000 + Math.random() * 900000)
        return await this.http.post(this.baseurl+'/auth/upload/'+id+'/'+userid,data,{responseType: 'text'})
    }

    public login(credentials:any):Observable<any>{
        return this.http.post<any>(this.baseurl+'/auth/login',credentials);
    }

    public register(data:any):Observable<any>{
        return this.http.post<any>(this.baseurl+'/auth/register',data);
    }

    public verify():Observable<any>{
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.get(this.baseurl+'/auth/verify',{'headers':headers});
    }
    
    public getUser(id:any):Observable<any>{
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.get(this.baseurl+'/auth/user/'+id,{'headers':headers});
    }
    
    loggedIn(){
        return !!localStorage.getItem('token')
    }

    public updateUser(id:any,data:any):Observable<any>{
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.post(this.baseurl+'/auth/update/'+id,data,{'headers':headers});
    }

    public sendforgotlink(email:string):Observable<any>{
        var data = {'email':email}
        return this.http.post(this.baseurl+'/auth/forgot',data)
    }

    public resetPassword(data:Object):Observable<any>{
        return this.http.post(this.baseurl+'/auth/reset',data)
    }

    public async setProfile(data:any):Promise<Observable<any>>{
        return await this.http.post(this.baseurl+'/auth/setprofile/',data)
    }
    // error node ma ave che jo angular ma nai ha to kar kaik me aane json.stringify karavyu to che chalav farithi 
    public getProfile(id:any):Observable<any>{
        return this.http.get(this.baseurl+'/auth/profilepic/'+id,{responseType:"text"})
    }

    public verifyotp(data:any):Observable<any>{
        return this.http.post(this.baseurl+'/auth/validateotp',data)
    }

    public resendotp(data:any):Observable<any>{
        return this.http.post(this.baseurl+'/auth/resendotp',data)
    }

    public room(data:any):Observable<any>{
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.post(this.baseurl+'/auth/room',data,{headers:headers})
    }

    public findroom(data:any):Observable<any>{
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.post(this.baseurl+'/auth/findroom',data,{headers:headers})
    }

    public deleteroom(data:any):Observable<any>{
        return this.http.post(this.baseurl+'/auth/deleteroom',data)
    }

    public updateroomuser(data:any):Observable<any>{
        return this.http.post(this.baseurl+'/auth/updateroomuser',data)
    }

    public contactus(data:any):Observable<any>{
        return this.http.post(this.baseurl+'/auth/contactus',data)
    }
}   


