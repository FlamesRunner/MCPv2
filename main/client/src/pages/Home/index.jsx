import Background from "../../images/background.jpg";
export default function Home() {
  return (
    <div
      className="bg-fixed w-screen bg-no-repeat bg-cover flex"
      style={{
        backgroundImage: "url(" + Background + ")",
        height: "60vh"
      }}
    >
        <div class="my-auto mx-auto text-white text-center">
            <h1 className="text-5xl">Minecraft Server Control Panel</h1>
            <h3 className="text-2xl mt-4">Manage your servers with ease, whether you're accessing the console, or need to stop the server and more.</h3>
        </div>
    </div>
  );
}
