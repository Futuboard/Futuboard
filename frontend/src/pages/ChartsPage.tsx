import ToolBar from "@/components/board/Toolbar"
import Charts from "@/components/charts/Charts"
import LoggedInContainer from "@/components/LoggedInContainer"

const ChartsContainer = () => {
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

export default ChartsContainer
