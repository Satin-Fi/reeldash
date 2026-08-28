async function checkCreatorReelsUserAvatar() {
  const res = await fetch('https://reeldash-nine.vercel.app/api/instagram/creator-reels?username=lifeof.romana');
  const j = await res.json();
  console.log("userAvatar in creator-reels:", j.userAvatar);
}

checkCreatorReelsUserAvatar();
