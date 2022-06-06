// Area:
    function Area(Increment, Count, Width, Height, Margin = 10) {
        let i = w = 0;
        let h = Increment * 0.75 + (Margin * 2);
        while (i < (Count)) {
            if ((w + Increment) > Width) {
                w = 0;
                h = h + (Increment * 0.75) + (Margin * 2);
            }
            w = w + Increment + (Margin * 2);
            i++;
        }
        if (h > Height) return false;
        else return Increment;
    }
// Dish:
    function Dish() {
        // variables:
            let Margin = 2;
            let Scenary = document.getElementById('Dish');
            let Width = Scenary.offsetWidth - (Margin * 2);
            let Height = Scenary.offsetHeight - (Margin * 2);
            let Cameras = document.getElementsByClassName('Camera');
            let max = 0;
        
        // loop (i recommend you optimize this)
            let i = 1;
            while (i < 5000) {
                let w = Area(i, Cameras.length, Width, Height, Margin);
                if (w === false) {
                    max =  i - 1;
                    break;
                }
                i++;
            }
        
        // set styles
            max = max - (Margin * 2);
            setWidth(max, Margin);
    }
    function fullscreen(device) {
        // variables:
            // let Margin = 2;
            if (device == 'other'){
                document.getElementById('content-video').getElementsByClassName('Camera')[0].getElementsByTagName('img')[0].style.height="100%"
                let Scenary = document.getElementById('content-video');
                let Height = Scenary.offsetHeight;
                let Cameras = document.getElementById('content-video').getElementsByClassName('Camera')[0];
                Cameras.getElementsByTagName('img')[0].style.width = (Height) - 20 + "px";
            }
            if(device == 'mobile'){
                if(window.orientation==90){
                    document.getElementById('content-video').getElementsByClassName('Camera')[0].getElementsByTagName('img')[0].style.height="100%"
                    let Scenary = document.getElementById('content-video').getElementsByClassName('Camera')[0];
                    let Height = Scenary.getElementsByTagName('img')[0].clientHeight;
                    let Cameras = document.getElementById('content-video').getElementsByClassName('Camera')[0];
                    Cameras.getElementsByTagName('img')[0].style.width = Height +"px";
                }else{
                    document.getElementById('content-video').getElementsByClassName('Camera')[0].getElementsByTagName('img')[0].style.width="100%"
                    let Scenary = document.getElementById('content-video').getElementsByClassName('Camera')[0];
                    let Width = Scenary.getElementsByTagName('img')[0].clientWidth;
                    let Cameras = document.getElementById('content-video').getElementsByClassName('Camera')[0];
                    Cameras.getElementsByTagName('img')[0].style.height = Width +"px";    
                }
            }
    }

// Set Width and Margin 
    function setWidth(width, margin) {
        let Cameras = document.getElementsByClassName('Camera');
        for (var s = 0; s < Cameras.length; s++) {
            Cameras[s].style.width = width + "px";
            Cameras[s].style.margin = margin + "px";
            Cameras[s].style.height = (width * 0.75) + "px";
            Cameras[s].getElementsByTagName('img')[0].style.width = (width * 0.75) - 20 + "px";
        }
    }
