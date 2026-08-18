import './faces.css';
import './HomeFace.css';

export default function HomeFace() {
  return (
    <div className="face home-face">
        
          <h1 className="face-title">Jad Menkara</h1>

          <br></br>
          <p className="face-subtitle" id="face-subtitle-A">"Hi! I'm Jad, an electrical (int.) engineering student at the University of Toronto. My strongest passions are in robotics/mechatronics engineering and computer vision"</p>

          <br></br>

          <div className="homeImages">


            <img src="/b.jpg"></img>
           {/*  <!--<img src="/c.webp"></img> */}
          </div>
          
        
      
    </div>
  );
}
