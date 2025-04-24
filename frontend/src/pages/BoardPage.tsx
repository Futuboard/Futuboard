import BoardContainer from "@/components/board/BoardContainer"
import LoggedInContainer from "@/components/general/LoggedInContainer"

const BoardPage = () => {
  return <LoggedInContainer>{(props) => <BoardContainer board={props.board} />}</LoggedInContainer>
}

export default BoardPage
