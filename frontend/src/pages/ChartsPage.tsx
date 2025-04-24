import Charts from "@/components/charts/Charts"
import LoggedInContainer from "@/components/general/LoggedInContainer"
import ToolBar from "@/components/general/Toolbar"

const ChartsPage = () => {
  return (
    <LoggedInContainer titlePrefix="Charts">
      {(props) => (
        <>
          <ToolBar boardId={props.board.boardid} title={props.board.title} chartToolbar={true} />
          <Charts board={props.board} />
        </>
      )}
    </LoggedInContainer>
  )
}

export default ChartsPage
