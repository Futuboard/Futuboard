import CloseIcon from "@mui/icons-material/Close"
import GroupsIcon from "@mui/icons-material/Groups"
import { CSSProperties, useState } from "react"

interface ModalFrameCvProps {
  cvFileName: string
}

const ModalFrameCv: React.FC<ModalFrameCvProps> = ({ cvFileName }) => {
  const [show, setShow] = useState(false)
  const display = show ? "block" : "none"
  const inlineStyles: Record<string, CSSProperties> = {
    modalViewer: {
      display: display,
      position: "fixed",
      zIndex: 1000,
      paddingTop: "100px",
      paddingBottom: "100px",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      overflow: "auto",
      backgroundColor: "white"
    },
    CVImage: {
      position: "absolute",
      top: "40%",
      left: "50%",
      maxWidth: "80%",
      maxHeight: "80%",
      transform: "translate(-50%, -50%) scale(0.9)",
      animation: "zoom 0.6s" // Using animation shorthand property
    }
  }
  return (
    <>
      <style>
        {`
                    @keyframes zoom {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(0.7);
                        }
                        to {
                            opacity: 1;
                            transform: translate(-50%, -50%) scale(0.9);
                        }
                    }
                `}
      </style>
      <GroupsIcon
        onClick={() => setShow(true)}
        sx={{
          color: "black",
          cursor: "pointer",
          padding: 0,
          "&:hover": {
            color: "#646cff"
          }
        }}
      />
      <div style={inlineStyles.modalViewer} id="modal-viewer">
        <CloseIcon
          onClick={() => setShow(false)}
          style={{
            fontSize: 40
          }}
          sx={{
            position: "absolute",
            top: "15px",
            right: "35px",
            color: "black",
            transition: "0.2s",
            cursor: "pointer",
            "&:hover": {
              color: "#646cff" // Change color on hover
            }
          }}
        />
        <img style={inlineStyles.CVImage} id="CV-image" alt="a picture of our cv" src={`/${cvFileName}`} />
      </div>
    </>
  )
}
export default ModalFrameCv
