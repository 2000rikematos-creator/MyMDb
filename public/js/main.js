const buttons = document.querySelectorAll(".button");

if(buttons){
    buttons.forEach(button => {
    button.addEventListener("mouseover",()=>{
        button.style.cursor="pointer";
    })
});
}
